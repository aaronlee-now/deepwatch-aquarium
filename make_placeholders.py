"""Make simple colored placeholder pictures for each room."""

import pygame

pygame.init()

WIDTH = 800
HEIGHT = 450

# room file name, color, label on the picture
ROOMS = [
    ("office.png", (30, 40, 55), "OFFICE"),
    ("lobby.png", (40, 70, 90), "CAM 1 - LOBBY"),
    ("gift_shop.png", (90, 60, 40), "CAM 2 - GIFT SHOP"),
    ("tropical_reef.png", (20, 100, 110), "CAM 3 - TROPICAL REEF"),
    ("shark_tunnel.png", (20, 50, 80), "CAM 4 - SHARK TUNNEL"),
    ("jellyfish_room.png", (50, 30, 90), "CAM 5 - JELLYFISH ROOM"),
    ("tide_pool.png", (40, 90, 70), "CAM 6 - TIDE POOL"),
    ("staff_hall.png", (60, 60, 60), "CAM 7 - STAFF HALL"),
    ("controls_room.png", (90, 40, 40), "CAM 8 - CONTROLS ROOM"),
    ("drain_hub.png", (35, 45, 35), "CAM 9 - DRAIN HUB"),
    ("filter_room.png", (55, 55, 70), "CAM 10 - FILTER ROOM"),
]


def make_image(filename, color, label):
    image = pygame.Surface((WIDTH, HEIGHT))
    image.fill(color)

    # lighter box in the middle so it looks a bit like a screen
    box = pygame.Rect(40, 40, WIDTH - 80, HEIGHT - 80)
    pygame.draw.rect(image, (color[0] + 20, color[1] + 20, color[2] + 20), box)
    pygame.draw.rect(image, (200, 220, 230), box, 3)

    font = pygame.font.SysFont(None, 48)
    text = font.render(label, True, (230, 240, 250))
    text_x = WIDTH // 2 - text.get_width() // 2
    text_y = HEIGHT // 2 - text.get_height() // 2
    image.blit(text, (text_x, text_y))

    small = pygame.font.SysFont(None, 28)
    tip = small.render("placeholder image", True, (180, 200, 210))
    image.blit(tip, (WIDTH // 2 - tip.get_width() // 2, text_y + 50))

    pygame.image.save(image, f"images/{filename}")
    print("saved images/" + filename)


def main():
    import os

    os.makedirs("images", exist_ok=True)
    for filename, color, label in ROOMS:
        make_image(filename, color, label)
    print("Done! Placeholder images are ready.")
    pygame.quit()


if __name__ == "__main__":
    main()
