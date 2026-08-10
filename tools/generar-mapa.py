#!/usr/bin/env python3
"""Genera js/europa-map.js (contornos de Europa en paths SVG) desde Natural Earth.

Solo hay que ejecutarlo si se quiere cambiar el encuadre del mapa, los paises
o las ciudades de la ruta. El resultado ya esta commiteado en js/europa-map.js.

    curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
    python3 tools/generar-mapa.py ne_50m_admin_0_countries.geojson

Fuente: Natural Earth 1:50m Admin 0 - Countries (dominio publico).
"""
import json, math, os, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "ne_50m_admin_0_countries.geojson"
DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                    "..", "js", "europa-map.js")

# Ventana geografica (lon/lat) que se vera en el mapa
LON0, LON1 = -12.0, 37.0
LAT0, LAT1 = 33.6, 70.4

# Conica conforme de Lambert: da a Europa la forma "abanico" clasica y una
# relacion de aspecto mas apaisada que Mercator (que estira el norte).
LAT_REF = (40.0, 62.0)  # paralelos estandar
LON_REF = 12.5          # meridiano central

WIDTH = 1000.0          # ancho del viewBox
SIMPLIFY = 1.0          # tolerancia Douglas-Peucker en unidades del viewBox
MIN_AREA = 1.6          # area minima de un anillo para conservarlo

KEEP = {
    "Spain", "Portugal", "France", "Ireland", "United Kingdom", "Belgium",
    "Netherlands", "Luxembourg", "Germany", "Denmark", "Norway", "Sweden",
    "Finland", "Estonia", "Latvia", "Lithuania", "Poland", "Czechia",
    "Slovakia", "Austria", "Switzerland", "Italy", "Slovenia", "Croatia",
    "Bosnia and Herz.", "Serbia", "Montenegro", "Kosovo", "Albania",
    "North Macedonia", "Greece", "Bulgaria", "Romania", "Hungary", "Moldova",
    "Ukraine", "Belarus", "Russia", "Turkey", "Andorra", "Monaco",
    "San Marino", "Vatican", "Malta", "Cyprus", "N. Cyprus", "Liechtenstein",
}


def _t(lat):
    return math.tan(math.pi / 4 + math.radians(lat) / 2)


_P1, _P2 = math.radians(LAT_REF[0]), math.radians(LAT_REF[1])
N = math.log(math.cos(_P1) / math.cos(_P2)) / math.log(_t(LAT_REF[1]) / _t(LAT_REF[0]))
F = math.cos(_P1) * _t(LAT_REF[0]) ** N / N


def lcc(lon, lat):
    """Conica conforme de Lambert (esfera de radio 1). y crece hacia el sur."""
    rho = F / _t(max(-89.0, min(89.0, lat))) ** N
    theta = N * math.radians(lon - LON_REF)
    return (rho * math.sin(theta), rho * math.cos(theta))


def _extent():
    xs, ys = [], []
    steps = 240
    for i in range(steps + 1):
        lon = LON0 + (LON1 - LON0) * i / steps
        for lat in (LAT0, LAT1):
            x, y = lcc(lon, lat)
            xs.append(x)
            ys.append(y)
        lat = LAT0 + (LAT1 - LAT0) * i / steps
        for lon2 in (LON0, LON1):
            x, y = lcc(lon2, lat)
            xs.append(x)
            ys.append(y)
    return min(xs), max(xs), min(ys), max(ys)


XMIN, XMAX, YMIN, YMAX = _extent()
SCALE = WIDTH / (XMAX - XMIN)
HEIGHT = (YMAX - YMIN) * SCALE


def project(lon, lat):
    x, y = lcc(lon, lat)
    return ((x - XMIN) * SCALE, (y - YMIN) * SCALE)


def clip_edge(poly, inside, intersect):
    """Un paso de Sutherland-Hodgman."""
    out = []
    n = len(poly)
    for i in range(n):
        cur, prv = poly[i], poly[(i - 1) % n]
        cin, pin = inside(cur), inside(prv)
        if cin:
            if not pin:
                out.append(intersect(prv, cur))
            out.append(cur)
        elif pin:
            out.append(intersect(prv, cur))
    return out


def clip_rect(poly, x0, y0, x1, y1):
    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    edges = [
        (lambda p: p[0] >= x0, lambda a, b: lerp(a, b, (x0 - a[0]) / (b[0] - a[0]))),
        (lambda p: p[0] <= x1, lambda a, b: lerp(a, b, (x1 - a[0]) / (b[0] - a[0]))),
        (lambda p: p[1] >= y0, lambda a, b: lerp(a, b, (y0 - a[1]) / (b[1] - a[1]))),
        (lambda p: p[1] <= y1, lambda a, b: lerp(a, b, (y1 - a[1]) / (b[1] - a[1]))),
    ]
    for inside, inter in edges:
        if not poly:
            return []
        poly = clip_edge(poly, inside, inter)
    return poly


def rdp(pts, eps):
    """Douglas-Peucker iterativo."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, ay = pts[i]
        bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        norm = math.hypot(dx, dy)
        best, bidx = -1.0, i
        for k in range(i + 1, j):
            px, py = pts[k]
            if norm == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * (px - ax) - dx * (py - ay)) / norm
            if d > best:
                best, bidx = d, k
        if best > eps:
            keep[bidx] = True
            stack.append((i, bidx))
            stack.append((bidx, j))
    return [p for p, k in zip(pts, keep) if k]


def area(pts):
    s = 0.0
    for i in range(len(pts)):
        x0_, y0_ = pts[i]
        x1_, y1_ = pts[(i + 1) % len(pts)]
        s += x0_ * y1_ - x1_ * y0_
    return abs(s) / 2


def rings_of(geom):
    t, c = geom["type"], geom["coordinates"]
    if t == "Polygon":
        return [c[0]]
    if t == "MultiPolygon":
        return [poly[0] for poly in c]
    return []


# Ciudades: origen, destino y posibles puntos de paso de la ruta
POINTS = {
    "MAD": ("Madrid",      -3.7038, 40.4168),
    "CPH": ("Copenhague",  12.5683, 55.6761),
    "BCN": ("Barcelona",    2.1734, 41.3851),
    "BOD": ("Burdeos",     -0.5792, 44.8378),
    "MRS": ("Marsella",     5.3698, 43.2965),
    "MIL": ("Milan",        9.1900, 45.4642),
    "ROM": ("Roma",        12.4964, 41.9028),
    "FLR": ("Florencia",   11.2558, 43.7696),
    "NAP": ("Napoles",     14.2681, 40.8518),
    "VCE": ("Venecia",     12.3155, 45.4408),
    "ZAG": ("Zagreb",      15.9819, 45.8150),
    "VIE": ("Viena",       16.3738, 48.2082),
    "BUD": ("Budapest",    19.0402, 47.4979),
    "KRK": ("Cracovia",    19.9450, 50.0647),
    "WAW": ("Varsovia",    21.0122, 52.2297),
    "PRG": ("Praga",       14.4378, 50.0755),
    "MUC": ("Munich",      11.5820, 48.1351),
    "ZRH": ("Zurich",       8.5417, 47.3769),
    "BER": ("Berlin",      13.4050, 52.5200),
    "PAR": ("Paris",        2.3522, 48.8566),
    "LON": ("Londres",     -0.1276, 51.5072),
    "AMS": ("Amsterdam",    4.9041, 52.3676),
    "HAM": ("Hamburgo",     9.9937, 53.5511),
    "GDN": ("Gdansk",      18.6466, 54.3520),
    "STO": ("Estocolmo",   18.0686, 59.3293),
    "OSL": ("Oslo",        10.7522, 59.9139),
}


def main():
    with open(SRC, encoding="utf-8") as fh:
        gj = json.load(fh)

    out = []
    for feat in gj["features"]:
        props = feat["properties"]
        name = props.get("NAME") or props.get("name")
        if name not in KEEP:
            continue
        iso = props.get("ISO_A2_EH") or props.get("ISO_A2") or ""
        if not iso or iso.startswith("-"):  # territorios sin codigo ISO
            iso = "XX"

        parts = []
        for ring in rings_of(feat["geometry"]):
            # descarte rapido por bbox geografico
            lons = [p[0] for p in ring]
            lats = [p[1] for p in ring]
            if max(lons) < LON0 or min(lons) > LON1 or max(lats) < LAT0 or min(lats) > LAT1:
                continue
            pts = [project(lon, lat) for lon, lat in ring]
            pts = clip_rect(pts, 0.0, 0.0, WIDTH, HEIGHT)
            if len(pts) < 3:
                continue
            if area(pts) < MIN_AREA:
                continue
            pts = rdp(pts, SIMPLIFY)
            if len(pts) < 3 or area(pts) < MIN_AREA:
                continue
            parts.append(pts)

        if not parts:
            continue
        parts.sort(key=area, reverse=True)
        d = []
        for pts in parts:
            seg = ["M%s,%s" % (fmt(pts[0][0]), fmt(pts[0][1]))]
            seg += ["L%s,%s" % (fmt(x), fmt(y)) for x, y in pts[1:]]
            d.append("".join(seg) + "Z")
        out.append({"id": iso, "name": name, "d": "".join(d)})

    out.sort(key=lambda c: c["name"])
    cities = {}
    for code, (label, lon, lat) in POINTS.items():
        x, y = project(lon, lat)
        cities[code] = [round(x, 1), round(y, 1)]

    js = [
        "/* =================================================================",
        "   Datos del mapa de Europa usados por la animacion del vuelo.",
        "   GENERADO por tools/generar-mapa.py: no editar a mano.",
        "   Origen: Natural Earth 50m (dominio publico), proyectado con una",
        "   conica conforme de Lambert (paralelos %gN/%gN, meridiano %gE)."
        % (LAT_REF[0], LAT_REF[1], LON_REF),
        "   - width / height: viewBox del SVG",
        "   - countries: [{ id: ISO-2, d: path SVG }]",
        "   - cities: { CODIGO: [x, y] } origen, destino y puntos de paso",
        "================================================================= */",
        "window.EUROPA_MAP = {",
        "  width: %d," % round(WIDTH),
        "  height: %d," % round(HEIGHT),
        "  cities: {",
    ]
    for code in POINTS:
        js.append("    %s: [%s, %s]," % (code, cities[code][0], cities[code][1]))
    js.append("  },")
    js.append("  countries: [")
    for c in out:
        js.append('    { id: "%s", d: "%s" },' % (c["id"], c["d"]))
    js.append("  ]")
    js.append("};")

    with open(DEST, "w", encoding="utf-8") as fh:
        fh.write("\n".join(js) + "\n")

    total = sum(len(c["d"]) for c in out)
    print("escrito %s | paises: %d | chars de path: %d | viewBox 0 0 %.0f %.0f"
          % (os.path.normpath(DEST), len(out), total, WIDTH, HEIGHT), file=sys.stderr)


def fmt(v):
    return ("%.1f" % v).rstrip("0").rstrip(".")


main()
