use std::env;
use std::path::Path;
use winreg::enums::*;
use winreg::RegKey;

#[tauri::command]
fn get_target_file() -> Option<String> {
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        let p = &args[1];
        if Path::new(p).exists() {
            return Some(p.clone());
        }
    }
    None
}

#[tauri::command]
fn send_to_recycle_bin(path: String) -> Result<bool, String> {
    trash::delete(&path).map(|_| true).map_err(|e| e.to_string())
}

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

#[tauri::command]
fn close_app(window: tauri::Window) {
    let _ = window.close();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_target_file,
            send_to_recycle_bin,
            register_context_menu,
            close_app
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
