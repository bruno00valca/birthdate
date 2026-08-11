#!/usr/bin/env python3
"""Genera los iconos de la pestana (favicon) con la paleta de Nyhavn.

Un regalito blanco con la cinta roja sobre un cuadrado azul. La forma se
describe una sola vez aqui y de ahi salen todos los formatos, asi que no hay
dos dibujos que se puedan desincronizar:

    assets/favicon.svg          vector (Chrome, Firefox, Edge)
    assets/favicon.ico          16/32/48 px (Safari y respaldo general)
    assets/apple-touch-icon.png 180 px (icono al guardar en la pantalla de
                                inicio de iOS; sin esquinas redondeadas,
                                que ya las recorta el sistema)

Solo hay que ejecutarlo si se cambia el dibujo. El resultado ya esta
commiteado en assets/.

    python3 tools/generar-favicon.py
"""
import math, os, struct, zlib

DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")

# Paleta de Nyhavn (la misma que css/styles.css)
BLUE = (0x2c, 0x6e, 0x9b)
WHITE = (0xfb, 0xf9, 0xf5)
RED = (0xd8, 0x40, 0x2f)

# El dibujo se define en un lienzo de 64x64 y luego se escala a cada tamano.
BOX = 64.0
BG_RADIUS = 13.0


def shapes(bg_radius=BG_RADIUS):
    """Las piezas del regalo, de atras hacia delante."""
    return [
        ("rect", (0, 0, 64, 64, bg_radius), BLUE),            # fondo
        ("ellipse", (25.0, 14.0, 6.4, 4.6, -26), RED),        # lazo (bucle izq.)
        ("ellipse", (39.0, 14.0, 6.4, 4.6, 26), RED),         # lazo (bucle der.)
        ("rect", (6.5, 18.5, 51, 12, 3), WHITE),              # tapa
        ("rect", (10.5, 30.5, 43, 26.5, 3.5), WHITE),         # caja
        ("rect", (28.4, 18.5, 7.2, 38.5, 0), RED),            # cinta vertical
    ]


# ----------------------------------------------------------------- SVG

def write_svg(path):
    out = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" '
        'role="img" aria-label="Un regalo">',
        "  <title>Un regalo</title>",
    ]
    for kind, geom, color in shapes():
        fill = "#%02x%02x%02x" % color
        if kind == "rect":
            x, y, w, h, r = geom
            radius = ' rx="%s"' % fmt(r) if r else ""
            out.append('  <rect x="%s" y="%s" width="%s" height="%s"%s fill="%s"/>'
                       % (fmt(x), fmt(y), fmt(w), fmt(h), radius, fill))
        else:
            cx, cy, rx, ry, angle = geom
            spin = (' transform="rotate(%s %s %s)"' % (fmt(angle), fmt(cx), fmt(cy))
                    if angle else "")
            out.append('  <ellipse cx="%s" cy="%s" rx="%s" ry="%s"%s fill="%s"/>'
                       % (fmt(cx), fmt(cy), fmt(rx), fmt(ry), spin, fill))
    out.append("</svg>")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")


def fmt(v):
    return ("%g" % round(float(v), 2))


# -------------------------------------------------------------- Rasterizado

def hit(kind, geom, x, y):
    """Esta el punto (x, y) dentro de la pieza? (en el lienzo de 64x64)"""
    if kind == "ellipse":
        cx, cy, ex, ey, angle = geom
        dx, dy = x - cx, y - cy
        if angle:   # se gira el punto al reves y se compara con la elipse recta
            a = math.radians(-angle)
            dx, dy = dx * math.cos(a) - dy * math.sin(a), dx * math.sin(a) + dy * math.cos(a)
        return (dx / ex) ** 2 + (dy / ey) ** 2 <= 1.0
    rx, ry, w, h, r = geom
    if not (rx <= x <= rx + w and ry <= y <= ry + h):
        return False
    if not r:
        return True
    # Fuera de las esquinas redondeadas no cuenta
    dx = max(rx + r - x, x - (rx + w - r), 0.0)
    dy = max(ry + r - y, y - (ry + h - r), 0.0)
    return dx * dx + dy * dy <= r * r


def render(size, bg_radius=BG_RADIUS):
    """Dibuja el icono a `size` px con suavizado por supermuestreo."""
    pieces = shapes(bg_radius)[::-1]     # de delante hacia atras: gana la primera
    ss = 8 if size <= 64 else 4          # muestras por lado y pixel
    step = BOX / (size * ss)
    weight = 1.0 / (ss * ss)
    px = bytearray(size * size * 4)

    for row in range(size):
        for col in range(size):
            r = g = b = a = 0.0
            for sy in range(ss):
                y = (row * ss + sy + 0.5) * step
                for sx in range(ss):
                    x = (col * ss + sx + 0.5) * step
                    for kind, geom, color in pieces:
                        if hit(kind, geom, x, y):
                            r += color[0] * weight
                            g += color[1] * weight
                            b += color[2] * weight
                            a += weight
                            break
            at = (row * size + col) * 4
            if a:
                # Colores sin premultiplicar: el color medio de lo que se pinto
                px[at] = int(round(r / a))
                px[at + 1] = int(round(g / a))
                px[at + 2] = int(round(b / a))
                px[at + 3] = int(round(a * 255))
    return px


# -------------------------------------------------------------- PNG / ICO

def png_bytes(px, size):
    raw = bytearray()
    for row in range(size):
        raw.append(0)                    # filtro "none" para cada linea
        raw += px[row * size * 4:(row + 1) * size * 4]

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
            + chunk(b"IEND", b""))


def ico_bytes(images):
    """Un .ico con varios PNG dentro (lo entienden todos los navegadores)."""
    offset = 6 + 16 * len(images)
    entries, blobs = b"", b""
    for size, data in images:
        entries += struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32,
                               len(data), offset)
        blobs += data
        offset += len(data)
    return struct.pack("<HHH", 0, 1, len(images)) + entries + blobs


def main():
    write_svg(os.path.join(DEST, "favicon.svg"))
    print("assets/favicon.svg")

    ico = []
    for size in (16, 32, 48):
        ico.append((size, png_bytes(render(size), size)))
    with open(os.path.join(DEST, "favicon.ico"), "wb") as fh:
        fh.write(ico_bytes(ico))
    print("assets/favicon.ico (16, 32, 48)")

    # iOS recorta el icono a su manera: mejor cuadrado, sin esquinas propias
    apple = png_bytes(render(180, bg_radius=0), 180)
    with open(os.path.join(DEST, "apple-touch-icon.png"), "wb") as fh:
        fh.write(apple)
    print("assets/apple-touch-icon.png (180)")


if __name__ == "__main__":
    main()
