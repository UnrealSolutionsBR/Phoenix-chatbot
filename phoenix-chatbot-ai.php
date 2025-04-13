<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot AI con múltiples asistentes, historial, reanudación de conversaciones y un panel de administración personalizado.
 * Version: 1.3.8
 * Author: Unreal Solutions
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ▸ Constantes
define( 'PHOENIX_CHATBOT_VERSION', '1.3.8' );
define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );
define( 'PHOENIX_CHATBOT_PATH', plugin_dir_path( __FILE__ ) );

// ▸ Incluir clases
require_once PHOENIX_CHATBOT_PATH . 'includes/class-phoenix-history.php';
require_once PHOENIX_CHATBOT_PATH . 'admin/class-phoenix-admin-chat.php';

// ▸ Inicializar clases
new \PhoenixChatbotAI\Phoenix_History();
new \PhoenixChatbotAI\Phoenix_Admin_Chat();

// ▸ Tipografía global
add_action('wp_head', function () {
    echo "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap' rel='stylesheet'>";
});

// ▸ Encolar scripts y estilos
add_action( 'wp_enqueue_scripts', function () {
    $js_version  = filemtime( PHOENIX_CHATBOT_PATH . 'assets/js/chatbot.js' );
    $css_version = filemtime( PHOENIX_CHATBOT_PATH . 'assets/css/chatbot.css' );
    $json_path   = PHOENIX_CHATBOT_PATH . 'assets/js/chatflow-config.json';

    $flow = [];
    if ( file_exists( $json_path ) ) {
        $json_content = file_get_contents( $json_path );
        $flow = json_decode( $json_content, true );
    }

    if ( is_user_logged_in() && current_user_can('manage_options') ) {
        // Admin visual
        wp_enqueue_script('phoenix-admin-dashboard', PHOENIX_CHATBOT_URL . 'assets/js/admin-dashboard.js', [], $js_version, true);
        wp_localize_script('phoenix-admin-dashboard', 'PhoenixChatMonitorData', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('phoenix_admin_chat')
        ]);
    }

    // Chatbot visible para todos
    wp_enqueue_style( 'phoenix-chatbot-style', PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css', [], $css_version );
    wp_enqueue_script( 'phoenix-chatbot-script', PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js', [], $js_version, true );

    wp_localize_script( 'phoenix-chatbot-script', 'phoenixChatbotBaseUrlData', [
        'baseUrl'  => PHOENIX_CHATBOT_URL,
        'ajaxurl'  => admin_url( 'admin-ajax.php' ),
        'flow'     => $flow
    ]);
});

// ▸ Shortcode: Chatbot en frontend
add_shortcode( 'Phoenix_chatbot', function () {
    ob_start(); ?>
    <div id="phoenix-loader" class="phoenix-loader"><div class="phoenix-spinner"></div></div>
    <div class="phoenix-chatbot-container" style="display: none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages"></div>
        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe aquí...">
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>
    <?php return ob_get_clean();
});

// ▸ Shortcode: Panel de administración en frontend
add_shortcode( 'Phoenix_admin_dashboard', function () {
    if ( ! current_user_can('manage_options') ) return '';
    return '<div id="phoenix-admin-dashboard-app"></div>';
});

// ▸ Crear tabla de historial en activación
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
