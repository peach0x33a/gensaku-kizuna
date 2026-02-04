# 📘 Pixiv App-API Specification (api.md)

## 1. Common Headers

All requests to `app-api.pixiv.net` must include the following headers to simulate a legitimate App client.

| Header | Description | Example/Algorithm |
| :--- | :--- | :--- |
| **User-Agent** | Simulates a real device | `PixivAndroidApp/5.0.234 (Android 11; Pixel 5)` |
| **Authorization** | Persistent authentication token | `Bearer <access_token>` |
| **Accept-Language** | Language preference | `zh-cn` (Ensures returned tags include Chinese translations) |
| **App-OS** | Operating System | `android` |
| **X-Client-Time** | ISO8601 Timestamp | `2026-01-29T21:17:08+08:00` |
| **X-Client-Hash** | Client request hash | `md5(Timestamp + "28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c")` |

---

## 2. Authentication (Auth)

> ⚠️ **Note**: Password login is now deprecated due to security policy adjustments. An access token must be obtained via `refresh_token`.

### Refresh Access Token
* **Method**: `POST`
* **URL**: `https://oauth.secure.pixiv.net/auth/token`
* **Body (Form-data)**:
    * `grant_type`: `refresh_token`
    * `refresh_token`: `<Refresh token provided by the user>`
    * `client_id`: `MOBrBqQCisH9M6m9mSRE69uOf90p`
    * `client_secret`: `8e096677f543666d9efCAD7820b98`

---

## 3. Core Business Interfaces

### 3.1 Subscription Polling & Updates (Feature 1)
Used to monitor artist activities and provide immediate push notifications.

#### Get Artist's Illustration List
* **Method**: `GET`
* **URL**: `/v1/user/illusts`
* **Parameters**:
    * `user_id`: (int/str) Required. The artist's UID.
    * `type`: `illust` (Illustration) or `manga` (Manga).
* **Logic**: Compare if `illusts[0].id` in the response matches the `last_pid` stored in the database.

#### Followed Artists' New Works Stream (Timeline)
* **Method**: `GET`
* **URL**: `/v1/illust/follow`
* **Parameters**:
    * `restrict`: `public` or `private`.

---

### 3.2 Work Details & Download (Feature 2)
Used to parse PID and handle anti-hotlinking image relay.

#### Get Detailed Metadata of a Work
* **Method**: `GET`
* **URL**: `/v1/illust/detail`
* **Parameters**:
    * `illust_id`: (int/str) Required. The work's PID.
* **Refresh Mechanism**: When a user clicks the "Refresh" button in Telegram, re-invoke this API to get the latest bookmark count or view count.

#### Get Ugoira (Animated Image) Resources
* **Method**: `GET`
* **URL**: `/v1/ugoira/metadata`
* **Parameters**:
    * `illust_id`: (int/str) Required.
* **Usage**: Obtain the zip download link for the animation and delay data (`delay`) for each frame.

---

### 3.3 User & Profile Information (Feature 3)
Used to retrieve and display artist profile cards.

#### Get User Details
* **Method**: `GET`
* **URL**: `/v1/user/detail`
* **Parameters**:
    * `user_id`: (int/str) Required.
* **Key Response Fields**:
    * `user.name`: Nickname.
    * `user.profile_image_urls.medium`: Avatar link.
    * `profile.total_illusts`: Total number of submissions.
    * `profile.total_follow_users`: Number of followers.

---

## 4. Interaction & Performance Logic

### 4.1 Image Download Handling (Anti-Hotlinking)
* **Referer Policy**: When downloading original image URLs, the request header must include `Referer: https://app-api.pixiv.net/`.
* **Streaming Relay**: In Bun, it is recommended to fetch image data and use grammY's `InputFile` to send it to Telegram as a stream to avoid local storage pressure.

### 4.2 Automatic Pagination (Next URL Parsing)
* **Logic**: If the response contains a `next_url` field, use a `parse_qs` utility to parse its query string and expand it as parameters for the next request.

### 4.3 Proxy-free Direct Connection (Mainland China Deployment)
* **SNI Bypass**: If deploying in Mainland China, refer to `example_bypass_sni.py`. Implement direct access by mapping `app-api.pixiv.net` to its corresponding IP address via a custom HTTP proxy to bypass SNI blocking.
