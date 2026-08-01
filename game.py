"""
Aquarium Night Guard - camera prototype
Click CAMERAS, then pick a room on the map.
Turtle (land) hides from the map. Shark (sea) shows on the map.
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


def draw_title_screen(screen, big_font, font, small_font, bg_image, title_timer):
    """Glitchy front menu with characters and Start Game."""
    # dark aquarium background
    screen.blit(bg_image, (0, 0))
    dark = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    dark.fill((0, 0, 0))
    dark.set_alpha(150)
    screen.blit(dark, (0, 0))

    # soft scan lines (always a little glitchy)
    for y in range(0, SCREEN_HEIGHT, 4):
        pygame.draw.line(screen, (0, 0, 0), (0, y), (SCREEN_WIDTH, y), 1)

    # big glitch flash every couple seconds
    heavy_glitch = int(title_timer * 2) % 7 == 0
    if heavy_glitch or random.random() < 0.08:
        draw_camera_glitch(screen)

    # characters (placeholder circles until real art)
    # sometimes they flicker away for a spooky frame
    show_characters = not (heavy_glitch and random.random() < 0.4)
    if show_characters:
        # Turtle (left)
        pygame.draw.circle(screen, (50, 140, 70), (260, 340), 78)
        pygame.draw.circle(screen, (80, 200, 90), (260, 340), 70)
        turtle_name = font.render("TURTLE", True, (180, 255, 190))
        screen.blit(turtle_name, (260 - turtle_name.get_width() // 2, 430))

        # Shark (right)
        pygame.draw.circle(screen, (30, 80, 140), (740, 340), 78)
        pygame.draw.circle(screen, (60, 140, 220), (740, 340), 70)
        shark_name = font.render("SHARK", True, (180, 210, 255))
        screen.blit(shark_name, (740 - shark_name.get_width() // 2, 430))

    # title can shake / split when glitching
    title_text = "Deepwatch Aquarium"
    title_x = SCREEN_WIDTH // 2
    title_y = 70
    if heavy_glitch:
        offset = random.randint(-6, 6)
        red = big_font.render(title_text, True, (220, 60, 60))
        cyan = big_font.render(title_text, True, (60, 200, 220))
        screen.blit(red, (title_x - red.get_width() // 2 + offset, title_y))
        screen.blit(cyan, (title_x - cyan.get_width() // 2 - offset, title_y))
    title = big_font.render(title_text, True, (230, 240, 255))
    screen.blit(title, (title_x - title.get_width() // 2, title_y))

    subtitle = font.render("Night Guard", True, (140, 200, 220))
    screen.blit(subtitle, (SCREEN_WIDTH // 2 - subtitle.get_width() // 2, 120))

    tip = small_font.render(
        "Survive 12 AM to 6 AM. Watch cams. Mind the drain.",
        True,
        (180, 200, 210),
    )
    screen.blit(tip, (SCREEN_WIDTH // 2 - tip.get_width() // 2, 160))


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

    office_image = load_image("office.png", (700, 400), darker=True)
    title_bg = load_image("lobby.png", (SCREEN_WIDTH, SCREEN_HEIGHT), darker=True)
    camera_images = []
    for _label, filename in CAMERAS:
        # camera pictures fill the whole window
        camera_images.append(
            load_image(filename, (SCREEN_WIDTH, SCREEN_HEIGHT), darker=True)
        )

    # start on the instructions screen
    # "instructions", "playing", "game_over", or "win"
    mode = "instructions"
    title_timer = 0.0

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

    open_cams_button = make_button("CAMERAS", 780, 500, 180, 50)
    close_cams_button = make_button("CLOSE CAMS", 800, 540, 170, 45)
    map_mode_button = make_button("SHOW DRAINS", 600, 360, 180, 40)
    # moved up a little so the oxygen bar fits underneath
    drain_button = make_button("CLOSE DRAIN", 20, 500, 180, 50)
    try_again_button = make_button("TRY AGAIN", 400, 400, 200, 50)
    start_button = make_button("START GAME", 375, 500, 250, 50)
    play_again_button = make_button("PLAY AGAIN", 400, 400, 200, 50)
    oxygen_bar_rect = pygame.Rect(20, 560, 180, 22)
    map_rect = pygame.Rect(580, 20, 400, 330)
    camera_rect = pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    def reset_night():
        nonlocal cameras_open, current_cam, drain_closed, oxygen
        nonlocal turtle_room, turtle_timer, shark_room, shark_timer
        nonlocal show_drain_map, night_hours, glitch_timer
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
                        mode = "playing"
                elif mode == "game_over":
                    if try_again_button["rect"].collidepoint(mouse_pos):
                        reset_night()
                        mode = "playing"
                elif mode == "win":
                    if play_again_button["rect"].collidepoint(mouse_pos):
                        mode = "instructions"
                elif mode == "playing":
                    if cameras_open:
                        if close_cams_button["rect"].collidepoint(mouse_pos):
                            cameras_open = False
                        if map_mode_button["rect"].collidepoint(mouse_pos):
                            show_drain_map = not show_drain_map
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

        # draw background
        screen.fill((15, 20, 30))

        if mode == "instructions":
            draw_title_screen(
                screen, big_font, font, small_font, title_bg, title_timer,
            )
            draw_button(screen, start_button, font, selected=True)
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
