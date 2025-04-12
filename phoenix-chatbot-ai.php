<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot AI con múltiples asistentes, saludo dinámico, almacenamiento de historial y panel de administración.
 * Version: 1.3.1
 * Author: Unreal Solutions
 * Plugin URI: https://unrealsolutions.com.br/
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// ▸ Constantes
define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );
define( 'PHOENIX_CHATBOT_PATH', plugin_dir_path( __FILE__ ) );

// ▸ Incluir clases necesarias
require_once PHOENIX_CHATBOT_PATH . 'includes/class-phoenix-history.php';
require_once PHOENIX_CHATBOT_PATH . 'admin/class-phoenix-admin-chat.php';

// ▸ Inicializar funcionalidades (con namespace)
new \PhoenixChatbotAI\Phoenix_History();
new \PhoenixChatbotAI\Phoenix_Admin_Chat();

// ▸ Cargar fuente Open Sans
add_action('wp_head', function () {
    echo "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap' rel='stylesheet'>";
});

// ▸ Encolar scripts y estilos del chatbot
add_action( 'wp_enqueue_scripts', 'phoenix_enqueue_chatbot_assets' );
function phoenix_enqueue_chatbot_assets() {
    $js_version  = filemtime( PHOENIX_CHATBOT_PATH . 'assets/js/chatbot.js' );
    $css_version = filemtime( PHOENIX_CHATBOT_PATH . 'assets/css/chatbot.css' );
    $json_path   = PHOENIX_CHATBOT_PATH . 'assets/js/chatflow-config.json';

    $flow = [];
    if ( file_exists( $json_path ) ) {
        $json_content = file_get_contents( $json_path );
        $flow = json_decode( $json_content, true );
    }

    $is_admin = current_user_can('administrator');

    wp_enqueue_style( 'phoenix-chatbot-style', PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css', [], $css_version );
    wp_enqueue_script( 'phoenix-chatbot-script', PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js', [], $js_version, true );

    wp_localize_script( 'phoenix-chatbot-script', 'phoenixChatbotBaseUrlData', [
        'baseUrl'  => PHOENIX_CHATBOT_URL,
        'flow'     => $flow,
        'isAdmin'  => $is_admin,
        'ajaxurl'  => admin_url( 'admin-ajax.php' )
    ]);
}

// ▸ Shortcode para mostrar el chatbot
add_shortcode( 'Phoenix_chatbot', 'phoenix_render_chatbot' );
function phoenix_render_chatbot() {
    ob_start(); ?>
    
    <!-- Loader inicial -->
    <div class="phoenix-loader" id="phoenix-loader">
        <div class="phoenix-spinner"></div>
    </div>

    <!-- Contenedor principal del chatbot -->
    <div class="phoenix-chatbot-container" style="display:none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages">
            <!-- Los mensajes aparecerán aquí -->
        </div>

        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe tu mensaje..." />
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>

    <?php return ob_get_clean();
}

// ▸ Crear tabla en la activación del plugin
register_activation_hook(__FILE__, 'phoenix_create_history_table');
function phoenix_create_history_table() {
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
        INDEX (session_id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
