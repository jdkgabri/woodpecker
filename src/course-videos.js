// Video for each course chapter ("course/chapter"), shown on the chapter page. Leave empty for no video.
// YouTube, Vimeo, a direct video file (https), or "storage:<path>" for a private file in Firebase Storage
// (only the accounts allowed in storage.rules can watch it). Never put the videos in the app itself.
export const COURSE_VIDEOS = {
  "italiana/1": 'storage:courses/italiana/1.mp4', // Italiana 1. Ideas y planes generales
  "italiana/2": 'storage:courses/italiana/2.mp4', // Italiana 2. Variante principal con Ac5 y a5
  "italiana/3": 'storage:courses/italiana/3.mp4', // Italiana 3. Variante principal con Ac5 y a6
  "italiana/4": 'storage:courses/italiana/4.mp4', // Italiana 4. El negro juega Ae7 y d6
  "italiana/5": 'storage:courses/italiana/5.mp4', // Italiana 5. El negro juega h6 rápido
  "italiana/6": 'storage:courses/italiana/6.mp4', // Italiana 6. El negro juega g6
  "italiana/7": 'storage:courses/italiana/7.mp4', // Italiana 7. El negro juega Cf6 y d5 o Cf6, Ac5 y d5
  "italiana/8": 'storage:courses/italiana/8.mp4', // Italiana 8. Partidas modelo
};
