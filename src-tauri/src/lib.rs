use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};
use tauri_plugin_notification::NotificationExt;
use winreg::enums::*;
use winreg::RegKey;

/// Chemin vers le bureau de l'utilisateur
fn get_desktop_dir() -> Option<PathBuf> {
    dirs::desktop_dir()
}

/// Étape 1 : Génération des 2 fichiers d'onboarding sur le Bureau
#[tauri::command]
fn start_onboarding(app: AppHandle) -> Result<Vec<String>, String> {
    let desktop = get_desktop_dir().ok_or("Bureau introuvable")?;

    let file1 = desktop.join("TrashDunk_Test_1.tmp");
    let file2 = desktop.join("TrashDunk_Test_2.tmp");

    fs::write(&file1, "Fichier temporaire 1 d'échauffement pour TrashDunk. Faites clic droit -> Dunk it 🏀 !").map_err(|e| e.to_string())?;
    fs::write(&file2, "Fichier temporaire 2 d'échauffement pour TrashDunk. Faites clic droit -> Dunk it 🏀 !").map_err(|e| e.to_string())?;

    // Notification native Windows
    let _ = app.notification()
        .builder()
        .title("🏀 Bienvenue sur TrashDunk !")
        .body("2 fichiers temporaires d'échauffement ont été placés sur votre Bureau. Faites un clic droit dessus et choisissez 'Dunk it' !")
        .show();

    Ok(vec![
        file1.to_string_lossy().to_string(),
        file2.to_string_lossy().to_string(),
    ])
}

/// Déplacement sécurisé vers la corbeille Windows
#[tauri::command]
fn send_to_recycle_bin(path: String) -> Result<bool, String> {
    trash::delete(&path).map(|_| true).map_err(|e| e.to_string())
}

/// Enregistrement du verbe shell dans le menu contextuel Windows
#[tauri::command]
fn register_context_menu() -> Result<bool, String> {
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

    Ok(true)
}

/// Récupérer les fichiers passés en argument (via clic droit "Dunk it")
#[tauri::command]
fn get_target_files() -> Vec<String> {
    let args: Vec<String> = env::args().collect();
    let mut files = Vec::new();
    for arg in args.into_iter().skip(1) {
        if Path::new(&arg).exists() {
            files.push(arg);
        }
    }
    files
}

/// Fermer ou masquer la fenêtre de jeu
#[tauri::command]
fn close_overlay(window: tauri::Window) {
    let _ = window.hide();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .setup(|app| {
            // Enregistrement automatique du menu contextuel au lancement
            let _ = register_context_menu();

            // Création du Tray Menu (icône dans la zone de notification Windows)
            let quit_i = MenuItem::with_id(app, "quit", "Quitter TrashDunk", true, None::<&str>)?;
            let onboard_i = MenuItem::with_id(app, "onboard", "Relancer l'échauffement", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Ouvrir l'arène", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &onboard_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("TrashDunk 🏀 - Actif en arrière-plan")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "onboard" => {
                        let _ = start_onboarding(app.clone());
                    }
                    _ => {}
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

            // Si lancé avec `--minimized` (démarrage automatique Windows), ne pas afficher la fenêtre
            let args: Vec<String> = env::args().collect();
            let is_minimized = args.iter().any(|a| a == "--minimized");

            if let Some(window) = app.get_webview_window("main") {
                if is_minimized && args.len() == 2 {
                    let _ = window.hide();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_onboarding,
            send_to_recycle_bin,
            register_context_menu,
            get_target_files,
            close_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
