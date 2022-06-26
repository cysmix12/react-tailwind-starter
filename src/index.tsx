import React from 'react';
import ReactDOM from 'react-dom/client';

import App from '@app/App';
import '@styles/index.scss';

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);

root.render(<App />);
