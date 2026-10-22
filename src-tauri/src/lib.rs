use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
use tauri_plugin_notification::NotificationExt;
use winreg::enums::*;
use winreg::RegKey;

static COLLECTED_FILES: Mutex<Vec<String>> = Mutex::new(Vec::new());
static FREE_MODE: Mutex<bool> = Mutex::new(false);

#[derive(Serialize, Deserialize, Default)]
struct AppConfig {
    is_installed: bool,
    is_onboarded: bool,
}

fn get_config_path() -> PathBuf {
    let mut p = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("TrashDunk");
    let _ = fs::create_dir_all(&p);
    p.push("settings.json");
    p
}

fn load_config() -> AppConfig {
    let path = get_config_path();
    if let Ok(data) = fs::read_to_string(path) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

fn save_config(cfg: &AppConfig) {
    let path = get_config_path();
    if let Ok(data) = serde_json::to_string(cfg) {
        let _ = fs::write(path, data);
    }
}

#[tauri::command]
fn get_app_status() -> AppConfig {
    load_config()
}

#[tauri::command]
fn install_service(app: AppHandle) -> Result<bool, String> {
    let current_exe = env::current_exe().map_err(|e| e.to_string())?;
    let exe_str = current_exe.to_string_lossy().to_string();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Enregistrement pour les fichiers ordinaires (*)
    let (key, _) = hkcu
        .create_subkey(r"Software\Classes\*\shell\TrashDunk")
        .map_err(|e| e.to_string())?;
    key.set_value("", &"Dunk it 🏀").map_err(|e| e.to_string())?;
    key.set_value("Icon", &exe_str).map_err(|e| e.to_string())?;
    let (cmd_key, _) = key
        .create_subkey("command")
        .map_err(|e| e.to_string())?;
    let cmd_value = format!("\"{}\" \"%1\"", exe_str);
    cmd_key.set_value("", &cmd_value).map_err(|e| e.to_string())?;

    // Enregistrement pour les dossiers (Directory)
    let (dir_key, _) = hkcu
        .create_subkey(r"Software\Classes\Directory\shell\TrashDunk")
        .map_err(|e| e.to_string())?;
    dir_key.set_value("", &"Dunk it 🏀").map_err(|e| e.to_string())?;
    dir_key.set_value("Icon", &exe_str).map_err(|e| e.to_string())?;
    let (dir_cmd_key, _) = dir_key
        .create_subkey("command")
        .map_err(|e| e.to_string())?;
    dir_cmd_key.set_value("", &cmd_value).map_err(|e| e.to_string())?;

    let (run_key, _) = hkcu
        .create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run")
        .map_err(|e| e.to_string())?;
    let run_cmd = format!("\"{}\" --background", exe_str);
    let _ = run_key.set_value("TrashDunk", &run_cmd);

    let mut cfg = load_config();
    cfg.is_installed = true;
    save_config(&cfg);

    if !cfg.is_onboarded {
        trigger_onboarding_files(&app)?;
    }

    if let Some(w) = app.get_webview_window("main") {
        let _ = w.set_fullscreen(true);
    }

    Ok(true)
}

fn trigger_onboarding_files(app: &AppHandle) -> Result<(), String> {
    let target_dir = dirs::document_dir()
        .or_else(dirs::desktop_dir)
        .ok_or("Dossier introuvable")?;

    let f1 = target_dir.join("Dunk_Me_1.tmp");
    let f2 = target_dir.join("Dunk_Me_2.tmp");

    let _ = fs::write(&f1, "Fichier 1 temporaire TrashDunk");
    let _ = fs::write(&f2, "Fichier 2 temporaire TrashDunk");

    let folder_name = target_dir.file_name().unwrap_or_default().to_string_lossy();

    let _ = app
        .notification()
        .builder()
        .title("🏀 TrashDunk : Échauffement requis !")
        .body(format!(
            "Dans '{}' : faites Ctrl + Clic sur [Dunk_Me_1.tmp] et [Dunk_Me_2.tmp] puis Clic Droit -> 'Dunk it 🏀' !",
            folder_name
        ))
        .show();

    Ok(())
}

#[tauri::command]
fn complete_onboarding() -> bool {
    let mut cfg = load_config();
    cfg.is_onboarded = true;
    save_config(&cfg);
    true
}

#[tauri::command]
fn send_to_recycle_bin(path: String) -> Result<bool, String> {
    trash::delete(&path).map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_recycle_bin() {
    let _ = Command::new("explorer.exe")
        .arg("shell:RecycleBinFolder")
        .spawn();
}

#[derive(Serialize, Deserialize, Clone)]
struct TargetFileInfo {
    path: String,
    name: String,
    ext: String,
    size_kb: u64,
}

#[tauri::command]
fn get_target_files_info() -> Vec<TargetFileInfo> {
    let raw_files = {
        let lock = COLLECTED_FILES.lock().unwrap();
        lock.clone()
    };

    let mut infos = Vec::new();
    for p in raw_files {
        let path = std::path::Path::new(&p);
        let is_dir = path.is_dir();
        let name = if is_dir {
            path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        } else {
            path.file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        };
        let ext = if is_dir {
            "dir".to_string()
        } else {
            path.extension()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        };
        let size_kb = fs::metadata(&p).map(|m| m.len() / 1024).unwrap_or(1);

        infos.push(TargetFileInfo {
            path: p,
            name,
            ext,
            size_kb,
        });
    }
    infos
}

#[tauri::command]
fn get_free_mode() -> bool {
    *FREE_MODE.lock().unwrap()
}

#[tauri::command]
fn set_free_mode(app: AppHandle, enabled: bool) {
    {
        let mut lock = FREE_MODE.lock().unwrap();
        *lock = enabled;
    }
    let _ = app.emit("trashdunk:free_mode_changed", enabled);
}

#[tauri::command]
fn close_overlay(app: AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
    {
        let mut lock = COLLECTED_FILES.lock().unwrap();
        lock.clear();
    }
    // Si on était en mode sans fichier, on repasse automatiquement sur OFF
    {
        let mut f_lock = FREE_MODE.lock().unwrap();
        if *f_lock {
            *f_lock = false;
            let _ = app.emit("trashdunk:free_mode_changed", false);
        }
    }
}

fn add_files_from_args(args: &[String]) {
    let mut lock = COLLECTED_FILES.lock().unwrap();
    for raw_arg in args.iter().skip(1) {
        let cleaned = raw_arg.trim().trim_matches('"').trim_matches('\'');
        if !cleaned.starts_with("--") {
            let path = std::path::Path::new(cleaned);
            if path.exists() {
                let s = path.to_string_lossy().to_string();
                if !lock.contains(&s) {
                    lock.push(s);
                }
            }
        }
    }
    if lock.is_empty() {
        let cfg = load_config();
        if !cfg.is_onboarded {
            if let Some(target_dir) = dirs::document_dir().or_else(dirs::desktop_dir) {
                let f1 = target_dir.join("Dunk_Me_1.tmp");
                let f2 = target_dir.join("Dunk_Me_2.tmp");
                if f1.exists() {
                    let s = f1.to_string_lossy().to_string();
                    if !lock.contains(&s) { lock.push(s); }
                }
                if f2.exists() {
                    let s = f2.to_string_lossy().to_string();
                    if !lock.contains(&s) { lock.push(s); }
                }
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Toujours réinitialiser la liste pour la nouvelle sélection provenant du clic droit
            {
                let mut lock = COLLECTED_FILES.lock().unwrap();
                lock.clear();
            }

            // Récupérer les nouveaux fichiers ciblés
            add_files_from_args(&args);
            let _ = app.emit("trashdunk:files_updated", ());

            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_fullscreen(true);
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
        .setup(|app| {
            let args: Vec<String> = env::args().collect();
            add_files_from_args(&args);

            let is_background = args.iter().any(|a| a == "--background");
            let has_files = args.iter().skip(1).any(|a| !a.starts_with("--"));

            let toggle_free_i = CheckMenuItem::with_id(
                app,
                "toggle_free",
                "Mode sans fichier (Ballons illimités)",
                true,
                false,
                None::<&str>,
            )?;

            let settings_menu = Submenu::with_items(app, "Paramètres ⚙️", true, &[&toggle_free_i])?;
            let quit_i = MenuItem::with_id(app, "quit", "Quitter TrashDunk", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings_menu, &quit_i])?;

            let toggle_free_ref = toggle_free_i.clone();

            let tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("TrashDunk 🏀 - En veille silencieuse")
                .on_menu_event(move |app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
                    } else if event.id.as_ref() == "toggle_free" {
                        let new_state = {
                            let mut lock = FREE_MODE.lock().unwrap();
                            *lock = !*lock;
                            *lock
                        };
                        let _ = toggle_free_ref.set_checked(new_state);
                        let _ = app.emit("trashdunk:free_mode_changed", new_state);
                        if new_state {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.set_fullscreen(true);
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            // Garder la référence du tray vivante au niveau de l'état global géré par Tauri
            app.manage(tray);

            let cfg = load_config();

            if let Some(w) = app.get_webview_window("main") {
                if is_background && !has_files {
                    let _ = w.hide();
                } else if has_files {
                    let _ = w.set_fullscreen(true);
                    let _ = w.show();
                } else if !cfg.is_installed {
                    let _ = w.show();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            install_service,
            complete_onboarding,
            send_to_recycle_bin,
            open_recycle_bin,
            get_target_files_info,
            get_free_mode,
            set_free_mode,
            close_overlay
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                // Empêcher l'application et le tray icon de se fermer quand la fenêtre est masquée
                api.prevent_exit();
            }
        });
}
