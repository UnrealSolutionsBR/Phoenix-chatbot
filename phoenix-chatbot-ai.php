<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot AI con múltiples asistentes, historial, flujo dinámico y panel de administración.
 * Version: 1.4.0
 * Author: Unreal Solutions
 * Plugin URI: https://unrealsolutions.com.br/
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ▸ Constantes del plugin
define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );
define( 'PHOENIX_CHATBOT_PATH', plugin_dir_path( __FILE__ ) );

// ▸ Cargar clases necesarias
require_once PHOENIX_CHATBOT_PATH . 'includes/class-phoenix-history.php';
require_once PHOENIX_CHATBOT_PATH . 'includes/class-phoenix-take-control.php';
require_once PHOENIX_CHATBOT_PATH . 'admin/class-phoenix-admin-chat.php';

// ▸ Inicializar clases
new \PhoenixChatbotAI\Phoenix_History();
new \PhoenixChatbotAI\Phoenix_Take_Control();

// ▸ Encolar fuente Open Sans (global)
add_action('wp_head', function () {
    echo "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap' rel='stylesheet'>";
});

// ▸ Encolar scripts y estilos para el chatbot (frontend)
add_action( 'wp_enqueue_scripts', function () {
    $json_path = PHOENIX_CHATBOT_PATH . 'assets/js/chatflow-config.json';
    $flow = [];

    if ( file_exists($json_path) ) {
        $json_content = file_get_contents($json_path);
        $flow = json_decode($json_content, true);
    }

    wp_enqueue_style(
        'phoenix-chatbot-style',
        PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css',
        [],
        filemtime(PHOENIX_CHATBOT_PATH . 'assets/css/chatbot.css')
    );

    wp_enqueue_script(
        'phoenix-chatbot-script',
        PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js',
        [],
        filemtime(PHOENIX_CHATBOT_PATH . 'assets/js/chatbot.js'),
        true
    );

    wp_localize_script('phoenix-chatbot-script', 'phoenixChatbotBaseUrlData', [
        'baseUrl'  => PHOENIX_CHATBOT_URL,
        'ajaxurl'  => admin_url('admin-ajax.php'),
        'flow'     => $flow,
        'isAdmin'  => current_user_can('administrator'),
    ]);
});

// ▸ Shortcode para mostrar el chatbot
add_shortcode('Phoenix_chatbot', function () {
    ob_start(); ?>
    <div class="phoenix-loader" id="phoenix-loader"><div class="phoenix-spinner"></div></div>
    <div class="phoenix-chatbot-container" style="display:none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages"></div>
        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe tu mensaje..." />
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>
    <?php return ob_get_clean();
});

// ▸ Shortcode para el dashboard de administración
add_shortcode('phoenix_admin_dashboard', function () {
    if (!current_user_can('manage_options')) return '';
    
    $admin = new \PhoenixChatbotAI\Phoenix_Admin_Chat();
    return $admin->render_dashboard_html();
});

// ▸ Crear tabla de historial al activar el plugin
register_activation_hook(__FILE__, function () {
    global $wpdb;
    $table_name = $wpdb->prefix . 'phoenix_history';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        session_id VARCHAR(64) NOT NULL,
        sender ENUM('user','bot','admin') NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX (session_id),
        INDEX (created_at)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
});
