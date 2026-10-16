// Copyright (c) 2026 oneDiversified.

import React from 'react';

const Generic: React.FC<{ type?: string }> = ({ type }) => (
    <div style={{ width: '100%', height: '100%', background: '#444', borderRadius: '50%', border: '1px solid #666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '6px', color: '#888' }}>{type ?? '?'}</span>
    </div>
);

export default Generic;
