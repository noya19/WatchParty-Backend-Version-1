## Watch Party Backend v1.0.1

 - The backend API for the Watch Party application, enabling synchronized movie streaming and real-time communication between users.

**Overview**
- 
Watch Party is a full-stack application that empowers users to upload and watch movies simultaneously, ensuring synchronized viewing experiences. This repository houses the backend components, consisting of a main app server and a WebSocket server. Its features are :
-   **Upload Handling:** The app server seamlessly manages movie uploads, making it easy for users to share their favorite films with others.
    
-   **Real-time Communication:** The WebSocket server facilitates communication between different users, enabling chat and real-time synchronization of movie playback.
    
-   **Quality Video Generation:** The library includes utility functions to generate videos in different quality levels from uploaded files, ensuring optimal viewing experiences across various devices and network conditions.
    
-   **Thumbnail Generation:** Automatic thumbnail generation at regular intervals (e.g., every 30 seconds) enhances the user interface and navigation during movie playback.

## Getting Started

 - Clone the Repo using git clone
 - Run `npm i` in the root directory to install all dependencies.
 - Install the ffmpeg library. Learn from this tutorial https://youtu.be/jZLqNocSQDM?si=Kf_yg6EXbTsx2OKU. Here the author creates a new folder in C Drive by the name "Path_Programs", you need to name it "FFMPEG" because I have named it that way ;) .
 - Run `npm run start` to start the server.
