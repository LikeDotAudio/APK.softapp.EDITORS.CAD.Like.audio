#!/usr/bin/env python3
# Copyright (c) 2026 oneDiversified.
#
# Changelog:
#   2026-10-10 - created (owner: "every icon we create... and use needs a full colour and a mono chrome").

"""
OneThing.Pods/APPLICATION.pod/Docker.Web Server/ASSETS/connectors/make_mono.py

Writes the MONO twin of every connector drawing: `<name>.svg` -> `<name>.mono.svg`.

Each colour becomes the grey of the same luminance (Rec. 709), alpha kept, so the
drawing keeps every edge, pin and shadow it had and loses only its hue. The colour
file stays the source; rerun this after editing one. `SRC/FEATURES/icons/connectorMono.test.ts` fails
when a drawing has no twin, or a twin still carries a hue.

    python3 make_mono.py
"""

import pathlib
import re

HEX = re.compile(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')


def grey(match: re.Match) -> str:
    h = match.group(1)
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    y = round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    return '#' + f'{y:02x}' * 3 + (h[6:8] if len(h) == 8 else '')


def main() -> None:
    root = pathlib.Path(__file__).parent
    n = 0
    for src in sorted(root.rglob('*.svg')):
        if src.name.endswith('.mono.svg'):
            continue
        out = src.with_name(src.stem + '.mono.svg')
        text = HEX.sub(grey, src.read_text(encoding='utf-8'))
        if not out.exists() or out.read_text(encoding='utf-8') != text:
            out.write_text(text, encoding='utf-8')
            n += 1
    print(f'{n} mono twin(s) written')


if __name__ == '__main__':
    main()
