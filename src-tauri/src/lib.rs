use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_notification::NotificationExt;
use winreg::enums::*;
use winreg::RegKey;

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
    // 1. Enregistrer le menu contextuel dans le registre
    let current_exe = env::current_exe().map_err(|e| e.to_string())?;
    let exe_str = current_exe.to_string_lossy().to_string();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
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

    // 2. Démarrage automatique Windows
    let (run_key, _) = hkcu
        .create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run")
        .map_err(|e| e.to_string())?;
    let run_cmd = format!("\"{}\" --background", exe_str);
    let _ = run_key.set_value("TrashDunk", &run_cmd);

    // 3. Sauvegarder l'état
    let mut cfg = load_config();
    cfg.is_installed = true;
    save_config(&cfg);

    // 4. Déclencher l'onboarding si non fait
    if !cfg.is_onboarded {
        trigger_onboarding_files(&app)?;
    }

    // Basculer la fenêtre en mode plein écran transparent pour le shoot
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

fn get_target_files() -> Vec<String> {
    let args: Vec<String> = env::args().collect();
    let mut files = Vec::new();
    for arg in args.into_iter().skip(1) {
        if !arg.starts_with("--") && std::path::Path::new(&arg).exists() {
            files.push(arg);
        }
    }
    if files.is_empty() {
        let cfg = load_config();
        if !cfg.is_onboarded {
            if let Some(target_dir) = dirs::document_dir().or_else(dirs::desktop_dir) {
                let f1 = target_dir.join("Dunk_Me_1.tmp");
                let f2 = target_dir.join("Dunk_Me_2.tmp");
                if f1.exists() {
                    files.push(f1.to_string_lossy().to_string());
                }
                if f2.exists() {
                    files.push(f2.to_string_lossy().to_string());
                }
            }
        }
    }
    files
}

#[derive(Serialize, Deserialize)]
struct TargetFileInfo {
    path: String,
    name: String,
    ext: String,
    size_kb: u64,
}

#[tauri::command]
fn get_target_files_info() -> Vec<TargetFileInfo> {
    let raw_files = get_target_files();
    let mut infos = Vec::new();

    for p in raw_files {
        let path = std::path::Path::new(&p);
        let name = path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let ext = path
            .extension()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
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
fn close_overlay(app: AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
        .setup(|app| {
            let args: Vec<String> = env::args().collect();
            let is_background = args.iter().any(|a| a == "--background");
            let has_files = args.iter().skip(1).any(|a| !a.starts_with("--"));

            // Configuration Tray Icon
            let quit_i = MenuItem::with_id(app, "quit", "Quitter TrashDunk", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("TrashDunk 🏀 - En veille silencieuse")
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "quit" {
                        app.exit(0);
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

            let cfg = load_config();

            if let Some(w) = app.get_webview_window("main") {
                if is_background && !has_files {
                    // Démarrage avec Windows : rester invisible
                    let _ = w.hide();
                } else if has_files {
                    // Clic droit "Dunk it" : plein écran transparent direct
                    let _ = w.set_fullscreen(true);
                    let _ = w.show();
                } else if !cfg.is_installed {
                    // Première ouverture de l'exe : afficher la modale d'installation
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
            get_target_files_info,
            close_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
