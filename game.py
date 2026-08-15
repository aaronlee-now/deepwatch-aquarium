"""
DEPRECATED — use the browser game instead (index.html + game.js).

Old Aquarium Night Guard pygame prototype. Kept for learning only.
The main game is the HTML/JavaScript version.
"""

import random

import pygame

pygame.init()

SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 600
FPS = 60

# how many seconds between moves
TURTLE_MOVE_TIME = 20.0
SHARK_MOVE_TIME = 20.0

# real-world seconds for each in-game hour (12 AM -> 6 AM)
SECONDS_PER_HOUR = 20.0

# camera static length after a creature moves
GLITCH_TIME = 0.5

# how long you must wait between sound lures
SOUND_COOLDOWN = 5.0

# camera list: button label, image file
CAMERAS = [
    ("CAM 1 Lobby", "lobby.png"),
    ("CAM 2 Gift Shop", "gift_shop.png"),
    ("CAM 3 Reef", "tropical_reef.png"),
    ("CAM 4 Shark Tunnel", "shark_tunnel.png"),
    ("CAM 5 Jellyfish", "jellyfish_room.png"),
    ("CAM 6 Tide Pool", "tide_pool.png"),
    ("CAM 7 Staff Hall", "staff_hall.png"),
    ("CAM 8 Controls", "controls_room.png"),
    ("CAM 9 Drain Hub", "drain_hub.png"),
    ("CAM 10 Filter", "filter_room.png"),
    ("CAM 11 Penguin", "penguin_cove.png"),
    ("CAM 12 Kelp", "kelp_forest.png"),
    ("CAM 13 Ray Bay", "ray_bay.png"),
    ("CAM 14 Cafe", "cafe.png"),
    ("CAM 15 Storage", "storage.png"),
    ("CAM 16 Deep Tank", "deep_tank.png"),
]

# map spots: short name, camera number (or None for office), x, y, w, h
# Lobby only connects to Gift and Reef (like the real pictures)
MAP_ROOMS = [
    ("Cafe", 13, 20, 40, 64, 32),
    ("Kelp", 11, 200, 40, 64, 32),
    ("Penguin", 10, 290, 40, 64, 32),
    ("Gift", 1, 20, 95, 64, 32),
    ("Lobby", 0, 110, 95, 64, 32),
    ("Reef", 2, 200, 95, 64, 32),
    ("Ray", 12, 290, 95, 64, 32),
    ("Storage", 14, 20, 150, 64, 32),
    ("Hall", 6, 110, 150, 64, 32),
    ("Shark", 3, 200, 150, 64, 32),
    ("Filter", 9, 290, 150, 64, 32),
    ("Tide", 5, 20, 205, 64, 32),
    ("Office", None, 110, 205, 64, 32),
    ("Drain", 8, 290, 205, 64, 32),
    ("Jelly", 4, 20, 260, 64, 32),
    ("Controls", 7, 110, 260, 64, 32),
    # Deep sits below Shark so Office--Drain does not cross its name
    ("Deep", 15, 200, 260, 64, 32),
]

# lines between rooms on the map (room name to room name)
# land animals (like Turtle) can use these door paths
MAP_LINKS = [
    # Lobby hub: only Gift Shop and Reef
    ("Lobby", "Gift"),
    ("Lobby", "Reef"),
    # left wing from Gift
    ("Gift", "Cafe"),
    ("Gift", "Storage"),
    ("Storage", "Tide"),
    ("Storage", "Hall"),
    ("Tide", "Jelly"),
    ("Tide", "Hall"),
    ("Jelly", "Controls"),
    # right wing from Reef
    ("Reef", "Kelp"),
    ("Reef", "Shark"),
    ("Kelp", "Penguin"),
    ("Kelp", "Ray"),
    ("Ray", "Penguin"),
    ("Ray", "Shark"),
    ("Shark", "Hall"),
    ("Shark", "Filter"),
    ("Shark", "Deep"),
    ("Penguin", "Filter"),
    ("Filter", "Deep"),
    ("Filter", "Drain"),
    ("Deep", "Drain"),
    # office area (no Office--Drain door line; that line used to cross Deep)
    ("Hall", "Office"),
]

# sea animals (like Shark) only travel through these drain rooms
DRAIN_LINKS = [
    ("Drain", "Office"),
    ("Drain", "Shark"),
    ("Drain", "Tide"),
    ("Drain", "Filter"),
    ("Drain", "Jelly"),
    ("Drain", "Deep"),
    ("Drain", "Ray"),
    ("Drain", "Kelp"),
    ("Drain", "Penguin"),
]

# drain MAP drawing: room-to-room pipes (like doors), reaches every room
DRAIN_MAP_LINKS = [
    # top row / upper wing
    ("Cafe", "Gift"),
    ("Kelp", "Penguin"),
    ("Kelp", "Reef"),
    ("Penguin", "Ray"),
    # lobby row
    ("Gift", "Lobby"),
    ("Lobby", "Reef"),
    ("Reef", "Ray"),
    # middle row
    ("Gift", "Storage"),
    ("Lobby", "Hall"),
    ("Reef", "Shark"),
    ("Ray", "Filter"),
    ("Storage", "Hall"),
    ("Hall", "Shark"),
    ("Shark", "Filter"),
    # lower row
    ("Storage", "Tide"),
    ("Hall", "Office"),
    ("Shark", "Deep"),
    ("Filter", "Drain"),
    ("Tide", "Office"),
    ("Office", "Deep"),
    ("Deep", "Drain"),
    # bottom row
    ("Tide", "Jelly"),
    ("Office", "Controls"),
    ("Deep", "Controls"),
    ("Jelly", "Controls"),
    ("Penguin", "Filter"),
]


def load_image(filename, size, darker=False):
    path = "images/" + filename
    image = pygame.image.load(path)
    image = pygame.transform.scale(image, size)
    if darker:
        # make the room look dimmer / more night-time
        shade = pygame.Surface(size)
        shade.fill((0, 0, 0))
        shade.set_alpha(70)
        image.blit(shade, (0, 0))
    return image


def make_grayscale(image):
    """Turn a picture gray so it looks like a newspaper photo."""
    image = image.convert()
    width, height = image.get_size()
    gray = pygame.Surface((width, height))
    for y in range(height):
        for x in range(width):
            color = image.get_at((x, y))
            shade = (color.r + color.g + color.b) // 3
            # a little extra contrast for print look
            shade = max(0, min(255, int((shade - 128) * 1.15 + 128)))
            gray.set_at((x, y), (shade, shade, shade))
    return gray


def add_print_grain(image, dots=400):
    """Add soft print speckles to a photo (once at startup)."""
    image = image.copy()
    width, height = image.get_size()
    for _ in range(dots):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        color = image.get_at((x, y))
        d = random.randint(-25, 15)
        image.set_at(
            (x, y),
            (
                max(0, min(255, color.r + d)),
                max(0, min(255, color.g + d)),
                max(0, min(255, color.b + d)),
            ),
        )
    return image


# The real FNaF newspaper is grayscale newsprint, not yellow paper,
# and every word on it is printed in Courier.
PAPER_GRAY = (228, 226, 220)
NEWSPAPER_TILT = -5


def make_paper_surface(width, height):
    """Make gray newsprint with a little texture (FNaF's paper is grayscale)."""
    paper = pygame.Surface((width, height))
    paper.fill(PAPER_GRAY)
    for _ in range(3000):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        d = random.randint(-16, 10)
        c = paper.get_at((x, y))
        shade = max(0, min(255, c.r + d))
        paper.set_at((x, y), (shade, shade, shade))
    return paper


def make_fnaf_newspaper_page(headline_font, body_font):
    """
    Build the Help Wanted page once, the way FNaF 1 does it:
    grayscale newsprint, blurred Courier filler columns, and one
    sharp boxed job ad. Drawn bigger than the window so the page can
    be tilted and zoomed without showing any corners.
    """
    width, height = 1400, 900
    page = make_paper_surface(width, height)

    # Courier is the font FNaF uses for the clippings
    filler_font = pygame.font.SysFont("courier,couriernew", 14)
    filler_lines = wrap_filler_lines(filler_font, NEWSPAPER_FILLER * 6, 195)

    # narrow columns with thin rules between them, like a classifieds page
    col_width = 205
    col_gap = 28
    cols = list(range(30, width - col_width, col_width + col_gap))
    for col_i, col in enumerate(cols):
        y = 20
        line_index = col_i * 7
        while y < height - 10:
            line = filler_lines[line_index % len(filler_lines)]
            text = filler_font.render(line, True, (108, 106, 102))
            page.blit(text, (col, y))
            y += 13
            line_index += 1
        if col_i < len(cols) - 1:
            rule_x = col + col_width + col_gap // 2
            pygame.draw.line(page, (168, 166, 161), (rule_x, 20), (rule_x, height - 20), 1)

    # smudge the filler so it reads as unreadable background text
    small = pygame.transform.smoothscale(page, (width // 3, height // 3))
    page = pygame.transform.smoothscale(small, (width, height))

    # the boxed HELP WANTED ad sits sharp on top of the blur
    ad_w, ad_h = 500, 450
    ad = pygame.Rect((width - ad_w) // 2, (height - ad_h) // 2, ad_w, ad_h)
    pygame.draw.rect(page, (242, 240, 235), ad)
    pygame.draw.rect(page, (25, 25, 25), ad, 7)

    title = headline_font.render("HELP WANTED", True, (15, 15, 15))
    page.blit(title, (ad.centerx - title.get_width() // 2, ad.y + 30))

    place = body_font.render("Deepwatch Aquarium", True, (15, 15, 15))
    page.blit(place, (ad.centerx - place.get_width() // 2, ad.y + 95))

    # same beats as the Freddy Fazbear's Pizza ad
    ad_lines = [
        "Family aquarium looking for security",
        "guard to work the nightshift.",
        "12 am to 6am.",
        "",
        "Monitor cameras, ensure safety of",
        "equipment and sea exhibits.",
        "",
        "Not responsible for soggy shoes",
        "or runaway crabs.",
        "",
        "$120 a week.",
        "To apply, call:",
        "1-888-DEEP-FISH",
    ]
    y = ad.y + 150
    for line in ad_lines:
        if line == "":
            y += 14
            continue
        text = body_font.render(line, True, (20, 20, 20))
        page.blit(text, (ad.centerx - text.get_width() // 2, y))
        y += 24

    return add_print_grain(page, dots=1400)


def draw_newspaper(screen, newspaper_page):
    """Show the paper tilted and zoomed in, the way the FNaF cutscene does."""
    screen.fill((0, 0, 0))

    tilted = pygame.transform.rotate(newspaper_page, NEWSPAPER_TILT)
    rect = tilted.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
    screen.blit(tilted, rect.topleft)

    # soft dark edges (kept light so the page stays bright)
    vignette = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
    for i in range(45):
        alpha = int(55 * (1 - i / 45))
        pygame.draw.rect(
            vignette,
            (0, 0, 0, alpha),
            (i, i, SCREEN_WIDTH - i * 2, SCREEN_HEIGHT - i * 2),
            1,
        )
    screen.blit(vignette, (0, 0))


def make_button(text, x, y, width, height):
    return {
        "text": text,
        "rect": pygame.Rect(x, y, width, height),
    }


def draw_button(screen, button, font, selected=False, danger=False, transparent=False):
    if selected:
        color = (70, 140, 90)
    elif danger:
        color = (140, 60, 60)
    else:
        color = (50, 80, 100)

    if transparent:
        # see-through button so the camera picture shows underneath
        panel = pygame.Surface((button["rect"].width, button["rect"].height), pygame.SRCALPHA)
        pygame.draw.rect(panel, (*color, 120), panel.get_rect(), border_radius=8)
        pygame.draw.rect(panel, (180, 210, 220, 180), panel.get_rect(), 2, border_radius=8)
        screen.blit(panel, button["rect"].topleft)
    else:
        pygame.draw.rect(screen, color, button["rect"], border_radius=8)
        pygame.draw.rect(screen, (180, 210, 220), button["rect"], 2, border_radius=8)

    label = font.render(button["text"], True, (240, 245, 250))
    label_x = button["rect"].x + 10
    label_y = button["rect"].y + button["rect"].height // 2 - label.get_height() // 2
    screen.blit(label, (label_x, label_y))


def room_center(room, map_x, map_y):
    _name, _cam, x, y, w, h = room
    return (map_x + x + w // 2, map_y + y + h // 2)


def room_edge_point(room, toward_point, map_x, map_y):
    """Find where a line from the room center hits the room's rectangle edge."""
    cx, cy = room_center(room, map_x, map_y)
    _name, _cam, x, y, w, h = room
    left = map_x + x
    top = map_y + y
    right = left + w
    bottom = top + h

    dx = toward_point[0] - cx
    dy = toward_point[1] - cy
    if dx == 0 and dy == 0:
        return (cx, cy)

    # how far until we hit a vertical or horizontal side
    if dx > 0:
        t_x = (right - cx) / dx
    elif dx < 0:
        t_x = (left - cx) / dx
    else:
        t_x = 10 ** 9

    if dy > 0:
        t_y = (bottom - cy) / dy
    elif dy < 0:
        t_y = (top - cy) / dy
    else:
        t_y = 10 ** 9

    t = min(t_x, t_y)
    return (cx + dx * t, cy + dy * t)


def find_room(name):
    for room in MAP_ROOMS:
        if room[0] == name:
            return room
    return None


def build_neighbors(links):
    """Make a dictionary: room name -> list of connected room names."""
    neighbors = {}
    for start_name, end_name in links:
        if start_name not in neighbors:
            neighbors[start_name] = []
        if end_name not in neighbors:
            neighbors[end_name] = []
        neighbors[start_name].append(end_name)
        neighbors[end_name].append(start_name)
    return neighbors


LAND_NEIGHBORS = build_neighbors(MAP_LINKS)
DRAIN_NEIGHBORS = build_neighbors(DRAIN_LINKS)


def move_threat(room, neighbors):
    """Maybe move to a connected room, or stay. Returns the room name."""
    choices = list(neighbors.get(room, []))
    # include current room so staying put is also random
    choices.append(room)
    return random.choice(choices)


def move_shark(shark_room, drain_closed):
    """Shark may move on drain paths, or stay. Closed drain blocks Office."""
    choices = list(DRAIN_NEIGHBORS.get(shark_room, []))
    if drain_closed and "Office" in choices:
        choices.remove("Office")
    choices.append(shark_room)
    return random.choice(choices)


def camera_to_room_name(cam_index):
    """Turn a camera number into a map room name like 'Lobby'."""
    for name, cam, _x, _y, _w, _h in MAP_ROOMS:
        if cam == cam_index:
            return name
    return None


def lure_if_neighbor(threat_room, target_room, neighbors):
    """
    If the threat is next to the target room, pull it there.
    Otherwise leave it where it is.
    """
    nearby = neighbors.get(target_room, [])
    if threat_room in nearby:
        return target_room
    return threat_room


def draw_camera_glitch(screen):
    """Draw short camera static over the feed."""
    for _ in range(50):
        y = random.randint(0, SCREEN_HEIGHT - 1)
        height = random.randint(1, 10)
        shade = random.randint(30, 230)
        alpha = random.randint(100, 200)
        bar = pygame.Surface((SCREEN_WIDTH, height), pygame.SRCALPHA)
        bar.fill((shade, shade, shade, alpha))
        screen.blit(bar, (0, y))

    # a few random blocks look like broken signal
    for _ in range(15):
        w = random.randint(20, 120)
        h = random.randint(8, 40)
        x = random.randint(0, SCREEN_WIDTH - w)
        y = random.randint(0, SCREEN_HEIGHT - h)
        shade = random.randint(0, 255)
        block = pygame.Surface((w, h), pygame.SRCALPHA)
        block.fill((shade, shade, shade, 160))
        screen.blit(block, (x, y))


def draw_map(screen, font, small_font, map_rect, current_cam, shark_room, show_drains):
    # draw map pieces on a see-through panel (no outer square)
    panel = pygame.Surface((map_rect.width, map_rect.height), pygame.SRCALPHA)

    if show_drains:
        title_text = "MAP - DRAINS"
        # room-to-room red pipes (not straight spokes from Drain Hub)
        link_list = DRAIN_MAP_LINKS
        line_color = (255, 60, 60, 230)
    else:
        title_text = "MAP - DOORS"
        link_list = MAP_LINKS
        line_color = (255, 255, 255, 220)

    title = font.render(title_text, True, (255, 255, 255))
    panel.blit(title, (20, 8))

    # draw connections between room edges (so lines don't cover the names)
    for start_name, end_name in link_list:
        start = find_room(start_name)
        end = find_room(end_name)
        if start and end:
            start_center = room_center(start, 0, 0)
            end_center = room_center(end, 0, 0)
            pygame.draw.line(
                panel,
                line_color,
                room_edge_point(start, end_center, 0, 0),
                room_edge_point(end, start_center, 0, 0),
                3,
            )

    # draw each room box — white outline only (no blue fill)
    for name, cam_index, x, y, w, h in MAP_ROOMS:
        rect = pygame.Rect(x, y, w, h)
        line_width = 3 if cam_index == current_cam else 2
        pygame.draw.rect(panel, (255, 255, 255, 220), rect, line_width, border_radius=6)

    # Shark (sea) shows on the map as a blue circle
    shark = find_room(shark_room)
    if shark:
        center = room_center(shark, 0, 0)
        pygame.draw.circle(panel, (60, 140, 220, 230), center, 10)

    # draw names last so no lines cover the words
    for name, cam_index, x, y, w, h in MAP_ROOMS:
        rect = pygame.Rect(x, y, w, h)
        display_name = "You" if name == "Office" else name
        label = small_font.render(display_name, True, (255, 255, 255))
        panel.blit(
            label,
            (
                rect.x + rect.width // 2 - label.get_width() // 2,
                rect.y + rect.height // 2 - label.get_height() // 2,
            ),
        )

    screen.blit(panel, map_rect.topleft)


def map_click_to_camera(mouse_pos, map_rect):
    """If the player clicked a map room with a camera, return that camera number."""
    for _name, cam_index, x, y, w, h in MAP_ROOMS:
        if cam_index is None:
            continue
        rect = pygame.Rect(map_rect.x + x, map_rect.y + y, w, h)
        if rect.collidepoint(mouse_pos):
            return cam_index
    return None


def draw_oxygen_bar(screen, font, x, y, width, height, oxygen):
    """Draw an oxygen bar. oxygen is from 0 to 100."""
    label = font.render("OXYGEN", True, (200, 220, 230))
    screen.blit(label, (x, y - 22))

    # empty bar outline
    bar_rect = pygame.Rect(x, y, width, height)
    pygame.draw.rect(screen, (30, 40, 50), bar_rect, border_radius=6)
    pygame.draw.rect(screen, (180, 210, 220), bar_rect, 2, border_radius=6)

    # filled part
    fill_width = int((width - 4) * (oxygen / 100))
    if fill_width > 0:
        if oxygen > 40:
            fill_color = (60, 160, 180)
        elif oxygen > 20:
            fill_color = (200, 160, 50)
        else:
            fill_color = (200, 70, 70)
        fill_rect = pygame.Rect(x + 2, y + 2, fill_width, height - 4)
        pygame.draw.rect(screen, fill_color, fill_rect, border_radius=4)


def draw_game_over(screen, big_font, font):
    """Show the out-of-air ending screen."""
    screen.fill((10, 15, 25))

    line1 = big_font.render("You Ran Out Of Air.", True, (230, 240, 255))
    line2 = big_font.render("GAME OVER", True, (220, 80, 80))
    tip = font.render("Click TRY AGAIN to restart.", True, (160, 180, 190))

    screen.blit(line1, (SCREEN_WIDTH // 2 - line1.get_width() // 2, 200))
    screen.blit(line2, (SCREEN_WIDTH // 2 - line2.get_width() // 2, 260))
    screen.blit(tip, (SCREEN_WIDTH // 2 - tip.get_width() // 2, 340))


def draw_title_static(screen, amount=30):
    """Light TV grain, like Freddy's menu."""
    for _ in range(amount):
        y = random.randint(0, SCREEN_HEIGHT - 1)
        height = random.randint(1, 3)
        shade = random.randint(0, 255)
        bar = pygame.Surface((SCREEN_WIDTH, height), pygame.SRCALPHA)
        bar.fill((shade, shade, shade, random.randint(20, 70)))
        screen.blit(bar, (0, y))


def draw_title_screen(screen, title_font, menu_font, small_font, bg_image, title_timer):
    """Freddy-style glitchy title menu (no characters)."""
    # background can twitch sideways a little
    shake_x = 0
    shake_y = 0
    if random.random() < 0.15:
        shake_x = random.randint(-4, 4)
        shake_y = random.randint(-2, 2)

    screen.blit(bg_image, (shake_x, shake_y))

    # very dark overlay (Freddy menus are almost black)
    dark = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    dark.fill((0, 0, 0))
    dark.set_alpha(175)
    screen.blit(dark, (0, 0))

    # right side stays a bit more visible (like the character side of the menu)
    right_dark = pygame.Surface((420, SCREEN_HEIGHT), pygame.SRCALPHA)
    right_dark.fill((0, 0, 0, 80))
    screen.blit(right_dark, (0, 0))

    # scan lines
    for y in range(0, SCREEN_HEIGHT, 3):
        pygame.draw.line(screen, (0, 0, 0), (0, y), (SCREEN_WIDTH, y), 1)

    # constant grain
    draw_title_static(screen, 35)

    # bigger static bursts
    if random.random() < 0.12:
        draw_camera_glitch(screen)

    # rare bright flash frame
    if random.random() < 0.03:
        flash = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        flash.fill((255, 255, 255, 40))
        screen.blit(flash, (0, 0))

    # title in the top-left (Freddy style)
    line1 = title_font.render("5 Nights at", True, (230, 230, 230))
    line2 = title_font.render("Deepwatch", True, (230, 230, 230))
    if random.random() < 0.1:
        # glitch the title sideways
        jitter = random.randint(-5, 5)
        screen.blit(line1, (70 + jitter, 80))
        screen.blit(line2, (70 - jitter, 130))
    else:
        screen.blit(line1, (70, 80))
        screen.blit(line2, (70, 130))

    # left menu, with >> on the selected option
    blink_on = int(title_timer * 3) % 2 == 0
    arrow = ">>" if blink_on else "  "
    new_game = menu_font.render(arrow + " New Game", True, (240, 240, 240))
    continue_text = menu_font.render("   Continue", True, (90, 90, 90))
    screen.blit(new_game, (80, 280))
    screen.blit(continue_text, (80, 330))

    # tiny footer like the real menus
    footer = small_font.render(
        "Survive until 6 AM",
        True,
        (120, 120, 120),
    )
    screen.blit(footer, (80, 540))


# How long the FNaF-style intro screens stay up
NEWSPAPER_SECONDS = 3.0
TWELVE_AM_SECONDS = 2.0

# Exact filler pattern from FNaF 1 Help Wanted newspaper (Scott Cawthon),
# with a softer aquarium-friendly ending for this kid game.
NEWSPAPER_FILLER = (
    "Blah. Blah. Blah, Blah. Blah. This ad has nothing to do with anything "
    "relevant to the game. Blah. Blah. Blah. Blah. Blah. Chances are you "
    "won't make it past Night 3. Blah. Blah. Yackity Smackity. Blah. Blah. "
    "This probably isn't the best choice of a summer job, since you most "
    "likely won't survive the week. I'd recommend being a cashier, sack boy, "
    "or work in a warehouse. They are all very respectable jobs, and you "
    "probably won't get chased by fish in them. Well, you might. But it would "
    "be unlikely. Blah. Blah. "
)


def wrap_filler_lines(font, text, max_width):
    """Break a long filler paragraph into lines that fit the newspaper."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        test = word if current == "" else current + " " + word
        if font.size(test)[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_twelve_am(screen, huge_font, font):
    """FNaF-style 12 AM screen right before the night starts."""
    screen.fill((0, 0, 0))
    # light static so it feels like the game transition
    if random.random() < 0.7:
        draw_title_static(screen, 25)

    label = huge_font.render("12 AM", True, (230, 230, 230))
    night = font.render("Night 1", True, (160, 160, 160))
    screen.blit(label, (SCREEN_WIDTH // 2 - label.get_width() // 2, 240))
    screen.blit(night, (SCREEN_WIDTH // 2 - night.get_width() // 2, 320))


def draw_night_complete(screen, big_font, font):
    """Show the win screen at 6 AM."""
    screen.fill((15, 30, 40))

    line1 = big_font.render("6 AM", True, (230, 240, 255))
    line2 = big_font.render("Night 1 Complete!", True, (100, 210, 140))
    tip = font.render("Click PLAY AGAIN to start over.", True, (160, 180, 190))

    screen.blit(line1, (SCREEN_WIDTH // 2 - line1.get_width() // 2, 180))
    screen.blit(line2, (SCREEN_WIDTH // 2 - line2.get_width() // 2, 240))
    screen.blit(tip, (SCREEN_WIDTH // 2 - tip.get_width() // 2, 320))


def hour_label(hours_past_midnight):
    """Turn 0..6 into clock text like 12 AM or 3 AM."""
    hour = int(hours_past_midnight)
    if hour <= 0:
        return "12 AM"
    if hour >= 6:
        return "6 AM"
    return str(hour) + " AM"


def draw_clock(screen, font, hours_past_midnight, x, y):
    """Draw the current night time."""
    text = font.render(hour_label(hours_past_midnight), True, (230, 240, 255))
    screen.blit(text, (x, y))


def main():
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Aquarium Night Guard - Cameras")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont(None, 28)
    big_font = pygame.font.SysFont(None, 40)
    small_font = pygame.font.SysFont(None, 20)
    title_font = pygame.font.SysFont(None, 64)
    menu_font = pygame.font.SysFont(None, 36)
    # FNaF prints its clippings in Courier
    newspaper_font = pygame.font.SysFont("courier,couriernew", 52, bold=True)
    newspaper_body = pygame.font.SysFont("courier,couriernew", 21)
    huge_font = pygame.font.SysFont(None, 96)

    office_image = load_image("office.png", (700, 400), darker=True)
    title_bg = load_image("lobby.png", (SCREEN_WIDTH, SCREEN_HEIGHT), darker=True)
    # FNaF-style Help Wanted newspaper page (built once, like a real cutscene image)
    newspaper_page = make_fnaf_newspaper_page(newspaper_font, newspaper_body)
    camera_images = []
    for _label, filename in CAMERAS:
        # camera pictures fill the whole window
        camera_images.append(
            load_image(filename, (SCREEN_WIDTH, SCREEN_HEIGHT), darker=True)
        )

    # start on the instructions screen
    # "instructions", "newspaper", "twelve_am", "playing", "game_over", or "win"
    mode = "instructions"
    title_timer = 0.0
    newspaper_timer = 0.0
    twelve_am_timer = 0.0

    # False = looking at office, True = looking at cameras
    cameras_open = False
    current_cam = 0
    # False = drain is open (air can come in), True = drain is shut
    drain_closed = False
    oxygen = 100.0

    # Turtle (land) starts far away — hidden from the map
    turtle_room = "Gift"
    turtle_timer = 0.0
    # Shark (sea) starts in the shark tunnel — shown on the map
    shark_room = "Shark"
    shark_timer = 0.0
    # False = show door links on map, True = show drain links
    show_drain_map = False
    # 0.0 = 12 AM, 6.0 = 6 AM
    night_hours = 0.0
    # counts down while cameras are glitching
    glitch_timer = 0.0
    # must wait before using PLAY SOUND again
    sound_cooldown = 0.0
    # short flash of "SOUND!" text on the camera
    sound_flash = 0.0

    open_cams_button = make_button("CAMERAS", 780, 500, 180, 50)
    close_cams_button = make_button("CLOSE CAMS", 800, 540, 170, 45)
    map_mode_button = make_button("SHOW DRAINS", 600, 360, 180, 40)
    # play sound lure while looking at a camera
    sound_button = make_button("PLAY SOUND", 20, 540, 170, 45)
    # moved up a little so the oxygen bar fits underneath
    drain_button = make_button("CLOSE DRAIN", 20, 500, 180, 50)
    try_again_button = make_button("TRY AGAIN", 400, 400, 200, 50)
    # invisible hit box over the "New Game" menu text
    start_button = make_button("New Game", 70, 270, 250, 50)
    play_again_button = make_button("PLAY AGAIN", 400, 400, 200, 50)
    oxygen_bar_rect = pygame.Rect(20, 560, 180, 22)
    map_rect = pygame.Rect(580, 20, 400, 330)
    camera_rect = pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    def reset_night():
        nonlocal cameras_open, current_cam, drain_closed, oxygen
        nonlocal turtle_room, turtle_timer, shark_room, shark_timer
        nonlocal show_drain_map, night_hours, glitch_timer
        nonlocal sound_cooldown, sound_flash
        cameras_open = False
        current_cam = 0
        drain_closed = False
        oxygen = 100.0
        turtle_room = "Gift"
        turtle_timer = 0.0
        shark_room = "Shark"
        shark_timer = 0.0
        show_drain_map = False
        night_hours = 0.0
        glitch_timer = 0.0
        sound_cooldown = 0.0
        sound_flash = 0.0

    running = True
    while running:
        # seconds since last frame (makes oxygen change smoothly)
        dt = clock.tick(FPS) / 1000

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mouse_pos = event.pos

                if mode == "instructions":
                    if start_button["rect"].collidepoint(mouse_pos):
                        reset_night()
                        newspaper_timer = 0.0
                        mode = "newspaper"
                elif mode == "newspaper":
                    # skip newspaper -> 12 AM screen (like starting Night 1)
                    twelve_am_timer = 0.0
                    mode = "twelve_am"
                elif mode == "twelve_am":
                    mode = "playing"
                elif mode == "game_over":
                    if try_again_button["rect"].collidepoint(mouse_pos):
                        reset_night()
                        twelve_am_timer = 0.0
                        mode = "twelve_am"
                elif mode == "win":
                    if play_again_button["rect"].collidepoint(mouse_pos):
                        mode = "instructions"
                elif mode == "playing":
                    if cameras_open:
                        if close_cams_button["rect"].collidepoint(mouse_pos):
                            cameras_open = False
                        if map_mode_button["rect"].collidepoint(mouse_pos):
                            show_drain_map = not show_drain_map
                        if (
                            sound_button["rect"].collidepoint(mouse_pos)
                            and sound_cooldown <= 0
                        ):
                            # lure animals that are next to this camera room
                            target = camera_to_room_name(current_cam)
                            if target is not None:
                                old_turtle = turtle_room
                                old_shark = shark_room
                                turtle_room = lure_if_neighbor(
                                    turtle_room, target, LAND_NEIGHBORS,
                                )
                                # closed office drain still blocks the shark
                                if not (drain_closed and target == "Office"):
                                    shark_room = lure_if_neighbor(
                                        shark_room, target, DRAIN_NEIGHBORS,
                                    )
                                if (
                                    turtle_room != old_turtle
                                    or shark_room != old_shark
                                ):
                                    glitch_timer = GLITCH_TIME
                            sound_cooldown = SOUND_COOLDOWN
                            sound_flash = 0.8
                        clicked_cam = map_click_to_camera(mouse_pos, map_rect)
                        if clicked_cam is not None:
                            current_cam = clicked_cam
                    else:
                        # drain controls only work in the office
                        if drain_button["rect"].collidepoint(mouse_pos):
                            drain_closed = not drain_closed
                        if open_cams_button["rect"].collidepoint(mouse_pos):
                            cameras_open = True

        if mode == "instructions":
            title_timer += dt

        if mode == "newspaper":
            # FNaF shows the paper for a couple seconds, then Night 1 begins
            newspaper_timer += dt
            if newspaper_timer >= NEWSPAPER_SECONDS:
                twelve_am_timer = 0.0
                mode = "twelve_am"

        if mode == "twelve_am":
            twelve_am_timer += dt
            if twelve_am_timer >= TWELVE_AM_SECONDS:
                mode = "playing"

        if mode == "playing":
            # clock moves from 12 AM toward 6 AM
            night_hours += dt / SECONDS_PER_HOUR
            if night_hours >= 6.0:
                night_hours = 6.0
                mode = "win"

            # oxygen drops only while the drain is closed
            if drain_closed:
                oxygen -= 3 * dt
            else:
                oxygen += 8 * dt
            oxygen = max(0, min(100, oxygen))

            if oxygen <= 0:
                mode = "game_over"

            if glitch_timer > 0:
                glitch_timer -= dt

            if sound_cooldown > 0:
                sound_cooldown -= dt
            if sound_flash > 0:
                sound_flash -= dt

            # Turtle may move on door paths, or stay put
            turtle_timer += dt
            if turtle_timer >= TURTLE_MOVE_TIME:
                turtle_timer = 0.0
                old_room = turtle_room
                turtle_room = move_threat(turtle_room, LAND_NEIGHBORS)
                if turtle_room != old_room:
                    glitch_timer = GLITCH_TIME

            # Shark may move on drain paths, or stay put
            shark_timer += dt
            if shark_timer >= SHARK_MOVE_TIME:
                shark_timer = 0.0
                old_room = shark_room
                shark_room = move_shark(shark_room, drain_closed)
                if shark_room != old_room:
                    glitch_timer = GLITCH_TIME

        # button text flips so you always know what click will do
        if drain_closed:
            drain_button["text"] = "OPEN DRAIN"
        else:
            drain_button["text"] = "CLOSE DRAIN"

        if show_drain_map:
            map_mode_button["text"] = "SHOW DOORS"
        else:
            map_mode_button["text"] = "SHOW DRAINS"

        if sound_cooldown > 0:
            sound_button["text"] = "WAIT " + str(int(sound_cooldown) + 1) + "s"
        else:
            sound_button["text"] = "PLAY SOUND"

        # draw background
        screen.fill((15, 20, 30))

        if mode == "instructions":
            draw_title_screen(
                screen, title_font, menu_font, small_font, title_bg, title_timer,
            )
        elif mode == "newspaper":
            draw_newspaper(screen, newspaper_page)
        elif mode == "twelve_am":
            draw_twelve_am(screen, huge_font, font)
        elif mode == "game_over":
            draw_game_over(screen, big_font, font)
            draw_button(screen, try_again_button, font, danger=True)
        elif mode == "win":
            draw_night_complete(screen, big_font, font)
            draw_button(screen, play_again_button, font, selected=True)
        elif mode == "playing" and cameras_open:
            # camera picture fills the whole screen
            screen.blit(camera_images[current_cam], (0, 0))

            if glitch_timer > 0:
                # static covers the feed for half a second after a move
                draw_camera_glitch(screen)
            else:
                # Turtle = green circle on camera (not on map)
                turtle_data = find_room(turtle_room)
                if turtle_data and turtle_data[1] == current_cam:
                    pygame.draw.circle(
                        screen,
                        (80, 200, 90),
                        (camera_rect.centerx - 50, camera_rect.centery),
                        40,
                    )

                # Shark = blue circle on camera
                shark_data = find_room(shark_room)
                if shark_data and shark_data[1] == current_cam:
                    pygame.draw.circle(
                        screen,
                        (60, 140, 220),
                        (camera_rect.centerx + 50, camera_rect.centery),
                        40,
                    )

            draw_map(
                screen, font, small_font, map_rect, current_cam,
                shark_room, show_drain_map,
            )
            draw_button(
                screen, map_mode_button, font,
                selected=show_drain_map, transparent=True,
            )
            draw_button(
                screen, sound_button, font,
                selected=(sound_flash > 0),
                danger=(sound_cooldown > 0),
                transparent=True,
            )
            if sound_flash > 0:
                beep = big_font.render("SOUND!", True, (255, 230, 80))
                screen.blit(beep, (20, 490))
            draw_button(screen, close_cams_button, font, transparent=True)
            draw_clock(screen, big_font, night_hours, 20, 20)
        elif mode == "playing":
            screen.blit(office_image, (150, 40))
            title = big_font.render("Night Guard Office", True, (220, 240, 255))
            screen.blit(title, (20, 20))
            draw_clock(screen, big_font, night_hours, 850, 20)

            # circles in the office if a threat got in (no jumpscare yet)
            if turtle_room == "Office":
                pygame.draw.circle(screen, (80, 200, 90), (430, 240), 50)
            if shark_room == "Office":
                pygame.draw.circle(screen, (60, 140, 220), (560, 240), 50)

            tip = font.render("Click CAMERAS to check the aquarium.", True, (160, 180, 190))
            screen.blit(tip, (20, 460))
            draw_button(screen, open_cams_button, font)
            draw_button(screen, drain_button, font, danger=drain_closed)
            draw_oxygen_bar(
                screen, small_font,
                oxygen_bar_rect.x, oxygen_bar_rect.y,
                oxygen_bar_rect.width, oxygen_bar_rect.height,
                oxygen,
            )

        pygame.display.flip()

    pygame.quit()


if __name__ == "__main__":
    main()
