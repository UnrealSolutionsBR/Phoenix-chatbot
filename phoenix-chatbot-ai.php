<?php
/**
 * Plugin Name: Phoenix Chatbot AI
 * Description: Chatbot AI con múltiples asistentes y saludo dinámico según la hora del día.
 * Version: 1.0
 * Author: Unreal Solutions
 * Plugin URI: https://unrealsolutions.com.br/
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'PHOENIX_CHATBOT_URL', plugin_dir_url( __FILE__ ) );

// Cargar estilos y scripts
add_action( 'wp_enqueue_scripts', 'phoenix_enqueue_chatbot_assets' );
function phoenix_enqueue_chatbot_assets() {
    $js_version  = filemtime( plugin_dir_path( __FILE__ ) . 'assets/js/chatbot.js' );
    $css_version = filemtime( plugin_dir_path( __FILE__ ) . 'assets/css/chatbot.css' );

    wp_enqueue_style( 'phoenix-chatbot-style', PHOENIX_CHATBOT_URL . 'assets/css/chatbot.css', [], $css_version );
    wp_enqueue_script( 'phoenix-chatbot-script', PHOENIX_CHATBOT_URL . 'assets/js/chatbot.js', [], $js_version, true );

    wp_localize_script( 'phoenix-chatbot-script', 'phoenixChatbotBaseUrlData', [
        'baseUrl' => PHOENIX_CHATBOT_URL
    ]);
}

// Registrar shortcode
add_shortcode( 'Phoenix_chatbot', 'phoenix_render_chatbot' );
function phoenix_render_chatbot() {
    ob_start(); ?>
    
    <!-- Loader con spinner -->
    <div class="phoenix-loader" id="phoenix-loader">
        <div class="phoenix-spinner"></div>
    </div>

    <!-- Contenedor del chatbot -->
    <div class="phoenix-chatbot-container" style="display:none;">
        <div id="phoenix-chat-messages" class="phoenix-chat-messages"></div>
        <div class="phoenix-chat-input-container">
            <input type="text" id="phoenix-user-input" placeholder="Escribe tu mensaje..." />
            <button id="phoenix-send-btn">Enviar</button>
        </div>
    </div>

    <?php return ob_get_clean();
}
