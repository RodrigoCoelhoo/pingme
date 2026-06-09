package com.pingme.shared.metrics;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public final class MetricsConstants {

    // Messages
    public static final String MESSAGES_SENT          = "pingme_messages_sent_total";
    public static final String MESSAGES_FAILURES      = "pingme_messages_failures_total";
    public static final String MESSAGES_UPLOADS       = "pingme_messages_uploads_total";
    public static final String LATENCY_MESSAGE_SAVE   = "pingme_latency_message_save";
    public static final String LATENCY_WS_DELIVERY    = "pingme_latency_ws_delivery";
    public static final String LATENCY_UPLOAD         = "pingme_latency_upload";

    // Chats
    public static final String CHATS_CREATED          = "pingme_chats_created_total";

    // WebSocket
    public static final String ONLINE_USERS           = "pingme_online_users";
    public static final String WEBSOCKET_SESSIONS     = "pingme_websocket_sessions";
    public static final String WS_CONNECTIONS_OPENED  = "pingme_ws_connections_opened_total";
    public static final String WS_CONNECTIONS_CLOSED  = "pingme_ws_connections_closed_total";
    public static final String WS_ERRORS              = "pingme_ws_errors_total";

    // System
    public static final String BACKEND_ERRORS         = "pingme_backend_errors_total";

    // Tag keys
    public static final String TAG_CHAT_TYPE  = "chat_type";
    public static final String TAG_REASON     = "reason";
    public static final String TAG_RESULT     = "result";
    public static final String TAG_TYPE       = "type";
    public static final String TAG_EXCEPTION  = "exception";

    // Tag values
    public static final String RESULT_SUCCESS = "success";
    public static final String RESULT_FAILURE = "failure";
}