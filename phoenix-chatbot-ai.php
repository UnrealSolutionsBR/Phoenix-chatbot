<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot AI con múltiples asistentes, saludo dinámico y flujo conversacional basado en JSON.
 * Version: 1.0
 * Author: Unreal Solutions
 * Plugin URI: https://unrealsolutions.com.br/
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Definir la URL base del plugin
define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );
define( 'PHOENIX_CHATBOT_PATH', plugin_dir_path( __FILE__ ) );

// Cargar fuente Open Sans desde Google Fonts
add_action('wp_head', function () {
    echo "<link href='https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap' rel='stylesheet'>";
});

// Encolar estilos y scripts
add_action( 'wp_enqueue_scripts', 'phoenix_enqueue_chatbot_assets' );
function phoenix_enqueue_chatbot_assets() {
    $js_version  = filemtime( PHOENIX_CHATBOT_PATH . 'assets/js/chatbot.js' );
    $css_version = filemtime( PHOENIX_CHATBOT_PATH . 'assets/css/chatbot.css' );
    $json_path   = PHOENIX_CHATBOT_PATH . 'assets/js/chatflow-config.json';

    // Leer y parsear el JSON de flujo
    $flow = [];
    if ( file_exists( $json_path ) ) {
        $json_content = file_get_contents( $json_path );
        $flow = json_decode( $json_content, true );
    }

    wp_enqueue_style( 'phoenix-chatbot-style', PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css', [], $css_version );
    wp_enqueue_script( 'phoenix-chatbot-script', PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js', [], $js_version, true );

    wp_localize_script( 'phoenix-chatbot-script', 'phoenixChatbotBaseUrlData', [
        'baseUrl' => PHOENIX_CHATBOT_URL,
        'flow'    => $flow
    ]);
}

// Shortcode para mostrar el chatbot
add_shortcode( 'Phoenix_chatbot', 'phoenix_render_chatbot' );
function phoenix_render_chatbot() {
    ob_start(); ?>

    <!-- Loader con spinner -->
    <div class="phoenix-loader" id="phoenix-loader">
        <div class="phoenix-spinner"></div>
    </div>

    <!-- Contenedor principal del chatbot -->
    <div class="phoenix-chatbot-container" style="display:none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages">
            <!-- Aquí se inyectan los mensajes vía JavaScript -->
        </div>

        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe tu mensaje..." />
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>

    <?php return ob_get_clean();
}
