import struct
import zlib

def write_png(filename, width, height, pixels):
    def chunk(tag, data):
        c = tag + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)

    raw = b''
    for row in pixels:
        raw += b'\x00'
        for (r, g, b, a) in row:
            raw += struct.pack('BBBB', r, g, b, a)

    compressed = zlib.compress(raw, 9)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)

    with open(filename, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', compressed))
        f.write(chunk(b'IEND', b''))


def heart_sdf(x, y, cx, cy, size):
    px = (x - cx) / size
    py = (y - cy) / size
    py = -py + 0.3
    val = (px*px + py*py - 1)**3 - px*px * py*py*py
    return val <= 0


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i]) * t) for i in range(3))


def rounded_rect_mask(x, y, w, h, radius):
    if x < radius and y < radius:
        return (x-radius)**2 + (y-radius)**2 <= radius**2
    if x > w-radius and y < radius:
        return (x-(w-radius))**2 + (y-radius)**2 <= radius**2
    if x < radius and y > h-radius:
        return (x-radius)**2 + (y-(h-radius))**2 <= radius**2
    if x > w-radius and y > h-radius:
        return (x-(w-radius))**2 + (y-(h-radius))**2 <= radius**2
    return True


def generate_icon(filename, size=512, rounded=True):
    top_color = (255, 117, 143)
    bottom_color = (224, 49, 98)
    radius = int(size * 0.22) if rounded else 0
    cx, cy = size/2, size/2 + size*0.04
    heart_size = size * 0.30

    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            t = y / size
            bg = lerp_color(top_color, bottom_color, t)
            inside_rect = rounded_rect_mask(x, y, size, size, radius)
            inside_heart = heart_sdf(x, y, cx, cy, heart_size)
            if not inside_rect:
                row.append((0, 0, 0, 0))
            elif inside_heart:
                row.append((255, 255, 255, 255))
            else:
                row.append((bg[0], bg[1], bg[2], 255))
        pixels.append(row)
    write_png(filename, size, size, pixels)
    print(f"Saved {filename}")


def generate_foreground(filename, size=512):
    cx, cy = size/2, size/2 + size*0.02
    heart_size = size * 0.20
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            if heart_sdf(x, y, cx, cy, heart_size):
                row.append((255, 255, 255, 255))
            else:
                row.append((0, 0, 0, 0))
        pixels.append(row)
    write_png(filename, size, size, pixels)
    print(f"Saved {filename}")


def generate_background(filename, size=512):
    top_color = (255, 117, 143)
    bottom_color = (224, 49, 98)
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            t = y / size
            bg = lerp_color(top_color, bottom_color, t)
            row.append((bg[0], bg[1], bg[2], 255))
        pixels.append(row)
    write_png(filename, size, size, pixels)
    print(f"Saved {filename}")


generate_icon('assets/icon.png', 512, rounded=True)
generate_foreground('assets/android-icon-foreground.png', 512)
generate_background('assets/android-icon-background.png', 512)
generate_foreground('assets/android-icon-monochrome.png', 512)
generate_icon('assets/favicon.png', 196, rounded=True)
generate_icon('assets/splash-icon.png', 512, rounded=False)
print("\nAll icons generated!")
