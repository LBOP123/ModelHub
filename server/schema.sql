CREATE DATABASE IF NOT EXISTS modelhub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE modelhub;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(80)  DEFAULT '',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Models
CREATE TABLE IF NOT EXISTS models (
  id            VARCHAR(50)  PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  category      ENUM('image','video','audio','text') NOT NULL,
  icon          VARCHAR(10)  NOT NULL DEFAULT '',
  description   TEXT         NOT NULL,
  price_label   VARCHAR(50)  NOT NULL DEFAULT '免费',
  price_cents   INT UNSIGNED NOT NULL DEFAULT 0,
  badge         ENUM('free','paid','beta') NOT NULL DEFAULT 'free',
  api_endpoint  VARCHAR(200) NOT NULL DEFAULT '',
  api_method    VARCHAR(10)  NOT NULL DEFAULT 'POST',
  api_base_url  VARCHAR(300) NOT NULL DEFAULT 'https://api.wuyinkeji.com',
  tags          JSON,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  is_async      TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- API Documentation
CREATE TABLE IF NOT EXISTS api_docs (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  model_id         VARCHAR(50)  NOT NULL,
  title            VARCHAR(100) NOT NULL,
  section_order    INT          NOT NULL DEFAULT 0,
  endpoint_url     VARCHAR(300) NOT NULL DEFAULT '',
  http_method      VARCHAR(10)  NOT NULL DEFAULT 'POST',
  headers_json     JSON,
  params_json      JSON,
  request_example  TEXT,
  response_example TEXT,
  notes_html       TEXT,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Call Records
CREATE TABLE IF NOT EXISTS call_records (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  model_id       VARCHAR(50)  NOT NULL,
  request_params JSON,
  response_url   VARCHAR(500) NOT NULL DEFAULT '',
  response_urls  JSON,
  task_id        VARCHAR(100) NOT NULL DEFAULT '',
  status         ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  error_message  VARCHAR(500) NOT NULL DEFAULT '',
  exec_time_ms   INT UNSIGNED DEFAULT NULL,
  is_deleted     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE RESTRICT,
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_model (model_id)
) ENGINE=InnoDB;

-- Seed: Models
INSERT INTO models (id, name, category, icon, description, price_label, badge, api_endpoint, api_base_url, tags, is_async, sort_order) VALUES
('gpt_image2',  'GPT Image 2',  'image', 'G2',
  '文本描述生成高质量图像，支持 14 种比例、参考图输入、异步任务处理',
  '¥0.08 / 次', 'paid', '/api/async/image_gpt', 'https://api.wuyinkeji.com',
  '["异步","多比例","参考图"]', 1, 1),
('qwen_text',   'Qwen 长文本',  'text',  'Qw',
  '通义千问长文本理解与生成，支持超长上下文对话、文档摘要与内容创作',
  '免费', 'free', '/api/text/qwen', 'https://api.wuyinkeji.com',
  '["长文本","对话","摘要"]', 0, 2),
('step_video',  'Step Video',   'video', 'SV',
  '阶跃星辰文生视频模型，文本描述生成高质量短视频片段',
  '¥0.50 / 次', 'paid', '/api/async/video_step', 'https://api.wuyinkeji.com',
  '["文生视频","异步","高清"]', 1, 3),
('minimax_tts', 'MiniMax TTS',  'audio', 'MM',
  '高保真语音合成，支持多音色、多语速、情感控制的文本转语音服务',
  '¥0.02 / 百字', 'paid', '/api/audio/tts', 'https://api.wuyinkeji.com',
  '["语音合成","多音色","情感"]', 0, 4);

-- Seed: API docs for GPT Image 2
INSERT INTO api_docs (model_id, title, section_order, endpoint_url, http_method, headers_json, params_json, request_example, response_example, notes_html) VALUES
('gpt_image2', '生成图像', 1,
  'https://api.wuyinkeji.com/api/async/image_gpt', 'POST',
  '[{"name":"Authorization","value":"接口密钥"},{"name":"Content-Type","value":"application/json"}]',
  '[{"name":"prompt","required":true,"type":"string","desc":"图像描述提示词"},{"name":"size","required":false,"type":"string","desc":"输出图像比例，默认 auto，可选值：auto / 1:1 / 3:2 / 2:3 / 16:9 / 9:16 / 4:3 / 3:4 / 21:9 / 9:21 / 1:3 / 3:1 / 2:1 / 1:2"},{"name":"urls","required":false,"type":"array","desc":"参考图片 URL 数组"}]',
  'POST https://api.wuyinkeji.com/api/async/image_gpt?key=你的密钥\n\n{\n  "prompt": "一只穿着宇航服的柴犬在月球上散步",\n  "size": "16:9",\n  "urls": ["https://example.com/ref.jpg"]\n}',
  '{\n  "code": 200,\n  "msg": "成功",\n  "data": {\n    "id": "image_4d39239e-776a-4cbd-a8eb-e2d9b4816829",\n    "count": 10\n  },\n  "exec_time": 0.29\n}',
  '<strong>状态码说明：</strong> 0 = 初始化, 1 = 进行中, 2 = 成功, 3 = 失败。任务为异步处理，提交后需轮询查询接口直到 status 为 2 或 3。建议轮询间隔 3 秒。'),
('gpt_image2', '查询任务状态', 2,
  'https://api.wuyinkeji.com/api/async/detail', 'GET',
  '[{"name":"Authorization","value":"接口密钥"},{"name":"Content-Type","value":"application/json"}]',
  '[{"name":"id","required":true,"type":"string","desc":"生成接口返回的任务 ID"}]',
  'GET https://api.wuyinkeji.com/api/async/detail?id=image_4d39239e-...',
  '{\n  "code": 200,\n  "msg": "成功",\n  "data": {\n    "status": 2,\n    "result": "https://cdn.example.com/generated.jpg"\n  }\n}',
  NULL);

-- Feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL,
  content       TEXT         NOT NULL,
  status        ENUM('pending','accepted','rejected','replied') NOT NULL DEFAULT 'pending',
  admin_reply   TEXT         DEFAULT NULL,
  replied_at    DATETIME     DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at DESC),
  INDEX idx_status (status)
) ENGINE=InnoDB;
