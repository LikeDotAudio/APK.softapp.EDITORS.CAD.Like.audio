// Part of the APK.audio project — http://APK.audio — made by Anthony Kuzub
// MIT Licence. Free, for everyone, for ever. Full text in LICENSE at the root.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { currentEntrance } from './shell/entrance';
import './index.css';

const host = document.getElementById('root');
if (!host) throw new Error('#root not found');

/* The tab and the window header both read this, and the two entrances are two
   different jobs, so the document says which one it is rather than leaving the
   index.html title to describe both (PLAN-60.07). */
const entrance = currentEntrance();
document.title =
  entrance.entrance === 'big-picture'
    ? 'BIG PICTURE.LIKE.AUDIO — Model The Part'
    : 'CAD.LIKE.AUDIO — Draw Your Shape';

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
