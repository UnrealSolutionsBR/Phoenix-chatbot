<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot conversacional con historial en tiempo real y monitoreo para admins.
 * Version: 1.3.2
 * Author: Unreal Solutions
 */

namespace PhoenixChatbotAI;

if ( ! defined( 'ABSPATH' ) ) exit;

// Definir constantes
define( 'PHOENIX_CHATBOT_VERSION', '1.3.2' );
define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );
define( 'PHOENIX_CHATBOT_PATH', plugin_dir_path( __FILE__ ) );

// Incluir clases principales
require_once PHOENIX_CHATBOT_PATH . 'includes/class-phoenix-history.php';
require_once PHOENIX_CHATBOT_PATH . 'includes/class-phoenix-admin-chat.php';

// Iniciar lógica del historial (frontal y admin)
new Phoenix_History();

// Iniciar panel de administración del chat
if ( is_admin() ) {
    new Phoenix_Admin_Chat();
}

// Registrar estilos y scripts del chatbot (frontal)
add_action('wp_enqueue_scripts', function () {
    if ( ! is_admin() ) {
        wp_enqueue_style( 'phoenix-chatbot-style', PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css', [], PHOENIX_CHATBOT_VERSION );
        wp_enqueue_script( 'phoenix-chatbot', PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js', [], PHOENIX_CHATBOT_VERSION, true );

        // Cargar y validar el archivo JSON
        $chatflow = [];
        $flow_path = PHOENIX_CHATBOT_PATH . 'chatflow-config.json';

        if ( file_exists($flow_path) && is_readable($flow_path) ) {
            $json_string = file_get_contents($flow_path);
            $chatflow = json_decode($json_string, true);
        }

        if ( ! is_array($chatflow) || ! isset($chatflow['conversation']) ) {
            $chatflow = ['conversation' => []];
        }

        wp_localize_script( 'phoenix-chatbot', 'phoenixChatbotBaseUrlData', [
            'baseUrl' => PHOENIX_CHATBOT_URL,
            'ajaxurl' => admin_url( 'admin-ajax.php' ),
            'flow'    => $chatflow,
        ]);
    }
});

// Registrar shortcode del chatbot
add_shortcode('Phoenix_chatbot', function () {
    ob_start();
    ?>
    <div id="phoenix-loader" class="phoenix-loader"><div class="phoenix-spinner"></div></div>
    <div class="phoenix-chatbot-container" style="display: none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages"></div>
        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe aquí...">
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>
    <?php
    return ob_get_clean();
});

// Crear tabla en la base de datos en la activación
register_activation_hook( __FILE__, function () {
    global $wpdb;
    $table = $wpdb->prefix . 'phoenix_history';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        session_id VARCHAR(100) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX (session_id),
        INDEX (created_at)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
});
