<?php
// Seguridad básica
if (!defined('ABSPATH')) {
    exit;
}

// Endpoint AJAX para enviar mensaje a OpenAI desde el chatbot
add_action('wp_ajax_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');
add_action('wp_ajax_nopriv_phoenix_chatbot_message', 'phoenix_handle_chatbot_message');

function phoenix_handle_chatbot_message() {
    if (!isset($_POST['message'])) {
        wp_send_json_error(['error' => 'No se recibió mensaje.']);
    }

    $user_message = sanitize_text_field($_POST['message']);
    $api_key = get_option('phoenix_openai_api_key');

    if (!$api_key) {
        wp_send_json_error(['error' => 'API Key no configurada.']);
    }

    $prompt = "Eres el asistente virtual de Unreal Solutions, una agencia creativa especializada en desarrollo web, edición de video y marketing digital. 
    Atiendes exclusivamente a clientes interesados en nuestros servicios: desarrollo de sitios web (especialmente en WordPress), producción audiovisual, estrategias de marketing (SEO, redes sociales, campañas pagadas).
    Tu tono es cercano, profesional y parte del equipo, usando frases como 'En Unreal Solutions te ayudamos a...'.
    
    ⚠️ Si un usuario te pide información que no se relaciona con estos servicios (como programación general, recetas, guías técnicas o temas fuera del marketing digital), educadamente rechaza diciendo que estás enfocado en ayudar dentro del alcance de Unreal Solutions.
    
    Tu misión es entender al cliente y ofrecerle soluciones dentro de nuestras especialidades. Si es necesario, sugiere agendar una reunión con nuestro equipo. Sé claro, útil y evita sonar como un robot.";

    $endpoint = 'https://api.openai.com/v1/chat/completions';

    $request_body = [
        'model' => 'gpt-3.5-turbo',
        'messages' => [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => $user_message],
        ],
        'temperature' => 0.7,
        'max_tokens' => 500,
    ];

    $response = wp_remote_post($endpoint, [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body' => json_encode($request_body),
        'timeout' => 20,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['error' => 'Error al conectar con OpenAI.']);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $reply = $body['choices'][0]['message']['content'] ?? 'Lo siento, no pude generar una respuesta.';

    wp_send_json_success(['reply' => $reply]);
}