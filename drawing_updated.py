#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple Presentation Order — v3
New in this version:
1) Left panel gets a vertical scrollbar when rows exceed the visible area (no more shrinking).
   - Mouse wheel scrolls the list; content is clipped to the panel.
2) Save CSV uses a native file dialog (tkinter); default directory is the script folder.
3) Text input supports IME (e.g., Chinese) via pygame.TEXTINPUT. We start/stop text input when focusing cells.
"""

import pygame
import sys
import random
import os
from datetime import datetime

# Optional: native save dialog via tkinter
try:
    import tkinter as tk
    from tkinter import filedialog
    TK_OK = True
except Exception:
    TK_OK = False

pygame.init()

# ------------------------------
# Theme
# ------------------------------
BG = (248, 249, 252)
CARD = (255, 255, 255)
BORDER = (220, 224, 230)
INK = (28, 33, 40)
SUB = (112, 118, 128)
BTN = (60, 99, 255)
BTN_H = (42, 81, 235)
OK = (39, 174, 96)
OK_H = (33, 150, 83)
ACTIVE_BG = (235, 242, 255)
ACTIVE_BORDER = (120, 160, 255)

FONT = pygame.font.Font(None, 28)
FONT_SM = pygame.font.Font(None, 22)
FONT_TITLE = pygame.font.Font(None, 40)

# ------------------------------
# Window (resizable)
# ------------------------------
W, H = 1000, 640
SCREEN = pygame.display.set_mode((W, H), pygame.RESIZABLE)
pygame.display.set_caption("Presentation Order")
CLOCK = pygame.time.Clock()

# ------------------------------
# Helpers
# ------------------------------
def render(text, font, color):
    return font.render(text, True, color)

def draw_card(rect):
    pygame.draw.rect(SCREEN, CARD, rect, border_radius=10)
    pygame.draw.rect(SCREEN, BORDER, rect, 1, border_radius=10)

def ask_save_csv_path(default_name):
    """Open a save dialog; returns absolute path or None."""
    if not TK_OK:
        # Fallback: save in CWD
        return os.path.abspath(default_name)
    root = tk.Tk()
    root.withdraw()
    initdir = os.path.abspath(os.path.dirname(sys.argv[0]))
    path = filedialog.asksaveasfilename(
        initialdir=initdir,
        initialfile=default_name,
        defaultextension=".csv",
        filetypes=[("CSV files", "*.csv")],
        title="Save CSV"
    )
    root.destroy()
    return path if path else None

def save_csv(order, path=None):
    if path is None:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        default_name = f"presentation_order_{ts}.csv"
        path = ask_save_csv_path(default_name)
        if not path:
            return None
    with open(path, "w", encoding="utf-8") as f:
        f.write("index,name\n")
        for i, name in enumerate(order, start=1):
            f.write(f"{i},{name}\n")
    return os.path.abspath(path)

# ------------------------------
# Cell model
# ------------------------------
class Cell:
    def __init__(self, text=""):
        self.text = text
        self.active = False

cells = [Cell() for _ in range(5)]
focused_idx = None

# scrolling
scroll_offset = 0  # in pixels; positive means scrolled down
MAX_SCROLL = 0

# ------------------------------
# App state
# ------------------------------
shuffling = False
shuffled_order = []
last_saved_path = None
shuffle_timer = 0
SHUFFLE_INTERVAL_MS = 80

# ------------------------------
# Layout calculators
# ------------------------------
def compute_layout():
    padding = 24
    col_gap = 24
    top = 70
    left_w = right_w = max(340, (W - padding*2 - col_gap) // 2)
    left_rect = pygame.Rect(padding, top, left_w, H - top - padding)
    right_rect = pygame.Rect(W - padding - right_w, top, right_w, H - top - padding)
    center_btn = pygame.Rect(W//2 - 90, H - 60, 180, 44)
    save_btn = pygame.Rect(right_rect.right - 150, right_rect.bottom - 50, 140, 36)
    return left_rect, right_rect, center_btn, save_btn

def layout_left_table(left_rect, n_rows):
    """Return (rows_rects, add_btn_rect, content_area_rect, header_y)."""
    header_h = 42
    add_btn_h = 36
    inner = left_rect.inflate(-20, -20)
    header_y = inner.y + header_h
    content = pygame.Rect(inner.x + 10, header_y + 8, inner.w - 20, inner.h - header_h - 8 - add_btn_h - 12)
    add_btn = pygame.Rect(inner.x + 10, inner.bottom - add_btn_h - 6, 110, add_btn_h)

    # Fixed row size when many -> use scrollbar instead of shrinking
    gap = 6
    row_h = 30
    rows_total_h = n_rows * row_h + (n_rows - 1) * gap if n_rows > 0 else 0

    # compute visible row rects based on scroll
    rows = []
    y = content.y - scroll_offset
    for _ in range(n_rows):
        rect = pygame.Rect(content.x + 36, y, content.w - 46, row_h)  # 36px for index
        rows.append(rect)
        y += row_h + gap

    # scrollbar metrics
    need_scroll = rows_total_h > content.h
    if need_scroll:
        # max scroll is rows_total_h - content.h
        global MAX_SCROLL
        MAX_SCROLL = max(0, rows_total_h - content.h)
    else:
        MAX_SCROLL = 0

    return rows, add_btn, content, header_y, rows_total_h, gap, row_h

def get_nonempty_names():
    seen = set()
    result = []
    for c in cells:
        name = c.text.strip()
        if name and name not in seen:
            seen.add(name)
            result.append(name)
    return result

# ------------------------------
# Drawing
# ------------------------------
def draw_left_panel(left_rect):
    global scroll_offset
    draw_card(left_rect)
    title = render("Names (one per row)", FONT, INK)
    SCREEN.blit(title, (left_rect.x + 14, left_rect.y + 12))
    pygame.draw.line(SCREEN, BORDER, (left_rect.x + 10, left_rect.y + 42), (left_rect.right - 10, left_rect.y + 42), 1)

    rows, add_btn, content, header_y, rows_total_h, gap, row_h = layout_left_table(left_rect, len(cells))

    # Clip drawing to content area
    prev_clip = SCREEN.get_clip()
    SCREEN.set_clip(content)

    # draw cells (only those intersecting content)
    for i, (cell, rect) in enumerate(zip(cells, rows), start=1):
        if not rect.colliderect(content):
            continue
        # index
        idx_surf = render(f"{i:02d}", FONT_SM, SUB)
        SCREEN.blit(idx_surf, (rect.x - 30, rect.y + (rect.h - idx_surf.get_height())//2))
        # bg/border
        bg = ACTIVE_BG if cell.active else (252, 253, 255)
        border_color = ACTIVE_BORDER if cell.active else BORDER
        pygame.draw.rect(SCREEN, bg, rect, border_radius=6)
        pygame.draw.rect(SCREEN, border_color, rect, 1, border_radius=6)
        # text / hint
        text_to_show = cell.text if cell.text or not cell.active else "Type here..."
        color = INK if cell.text else (BTN if cell.active else SUB)
        SCREEN.blit(render(text_to_show, FONT, color), (rect.x + 8, rect.y + (rect.h-22)//2))

    # restore clip
    SCREEN.set_clip(prev_clip)

    # scrollbar
    rows_total_h = max(rows_total_h, 1)
    if rows_total_h > content.h:
        rail = pygame.Rect(content.right - 8, content.y, 4, content.h)
        pygame.draw.rect(SCREEN, (230, 234, 240), rail, border_radius=2)
        # thumb height proportion
        ratio = content.h / rows_total_h
        thumb_h = max(24, int(content.h * ratio))
        if MAX_SCROLL == 0:
            thumb_y = content.y
        else:
            thumb_y = content.y + int((scroll_offset / MAX_SCROLL) * (content.h - thumb_h))
        thumb = pygame.Rect(content.right - 12, thumb_y, 8, thumb_h)
        pygame.draw.rect(SCREEN, (180, 186, 196), thumb, border_radius=3)

    # add row button
    pygame.draw.rect(SCREEN, BTN, add_btn, border_radius=8)
    SCREEN.blit(render("+ Add row", FONT_SM, (255, 255, 255)), render("+ Add row", FONT_SM, (255, 255, 255)).get_rect(center=add_btn.center))

    return rows, add_btn, content

def draw_right_panel(right_rect):
    draw_card(right_rect)
    title = render("Result (random shuffle)", FONT, INK)
    SCREEN.blit(title, (right_rect.x + 14, right_rect.y + 12))
    pygame.draw.line(SCREEN, BORDER, (right_rect.x + 10, right_rect.y + 42), (right_rect.right - 10, right_rect.y + 42), 1)
    # list
    y = right_rect.y + 54
    line_h = 26
    for i, name in enumerate(shuffled_order, start=1):
        if y > right_rect.bottom - 16:
            break
        SCREEN.blit(render(f"{i:02d}. {name}", FONT_SM, INK), (right_rect.x + 16, y))
        y += line_h

def draw_center_button(center_btn):
    color = OK if shuffling else BTN
    color_h = OK_H if shuffling else BTN_H
    hovering = center_btn.collidepoint(pygame.mouse.get_pos())
    pygame.draw.rect(SCREEN, color_h if hovering else color, center_btn, border_radius=10)
    label = "Stop" if shuffling else "Draw"
    surf = render(label, FONT, (255, 255, 255))
    SCREEN.blit(surf, surf.get_rect(center=center_btn.center))

def draw_save_button(save_btn):
    enabled = (not shuffling) and len(shuffled_order) > 0
    color = BTN if enabled else (200, 205, 214)
    pygame.draw.rect(SCREEN, color, save_btn, border_radius=8)
    SCREEN.blit(render("Save CSV", FONT_SM, (255, 255, 255)), render("Save CSV", FONT_SM, (255, 255, 255)).get_rect(center=save_btn.center))
    return enabled

# ------------------------------
# Main
# ------------------------------
def main():
    global W, H, SCREEN, focused_idx, shuffling, shuffled_order, shuffle_timer, last_saved_path, scroll_offset

    running = True
    while running:
        dt = CLOCK.tick(60)
        SCREEN.fill(BG)

        left_rect, right_rect, center_btn, save_btn = compute_layout()

        # Header
        SCREEN.blit(render("Simple Presentation Order", FONT_TITLE, INK), (24, 20))

        # Panels
        rows, add_btn, content_area = draw_left_panel(left_rect)
        draw_right_panel(right_rect)
        draw_center_button(center_btn)
        save_enabled = draw_save_button(save_btn)

        # Saved hint
        if last_saved_path:
            SCREEN.blit(render(f"Saved CSV to: {last_saved_path}", FONT_SM, SUB), (24, H - 26))

        # Events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.VIDEORESIZE:
                W, H = max(700, event.w), max(480, event.h)
                SCREEN = pygame.display.set_mode((W, H), pygame.RESIZABLE)

            elif event.type == pygame.MOUSEWHEEL:
                # Scroll only when mouse over left content area
                if content_area.collidepoint(pygame.mouse.get_pos()):
                    if MAX_SCROLL > 0:
                        scroll_offset -= event.y * 30  # wheel step
                        scroll_offset = max(0, min(scroll_offset, MAX_SCROLL))

            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                mx, my = event.pos
                # focus cells
                focused = False
                for i, rect in enumerate(rows):
                    if rect.collidepoint((mx, my)):
                        focused_idx = i
                        for j, c in enumerate(cells):
                            c.active = (j == i)
                        focused = True
                        # enable IME text input and set input rectangle
                        pygame.key.start_text_input()
                        pygame.key.set_text_input_rect(rect)
                        break
                if not focused:
                    # click outside cells
                    for c in cells:
                        c.active = False
                    focused_idx = None
                    pygame.key.stop_text_input()

                # add row
                if add_btn.collidepoint((mx, my)):
                    cells.append(Cell())

                # draw/stop
                if center_btn.collidepoint((mx, my)):
                    if shuffling:
                        shuffling = False
                    else:
                        names = get_nonempty_names()
                        if names:
                            shuffling = True
                            shuffled_order = names[:]
                            random.shuffle(shuffled_order)
                            shuffle_timer = 0

                # save
                if save_btn.collidepoint((mx, my)) and save_enabled:
                    path = save_csv(shuffled_order, path=None)
                    if path:
                        last_saved_path = path

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif focused_idx is not None:
                    cell = cells[focused_idx]
                    if event.key == pygame.K_BACKSPACE:
                        cell.text = cell.text[:-1]
                    elif event.key in (pygame.K_RETURN, pygame.K_TAB):
                        # move to next cell (auto-add at end)
                        if focused_idx == len(cells)-1:
                            cells.append(Cell())
                        focused_idx = min(focused_idx + 1, len(cells)-1)
                        for j, c in enumerate(cells):
                            c.active = (j == focused_idx)
                        # update IME input rect to new cell
                        # recalc rows to get latest rect
                        rows, _, _, _, _, _, _ = layout_left_table(left_rect, len(cells))
                        pygame.key.set_text_input_rect(rows[focused_idx])

            # IME-friendly text input
            if event.type == pygame.TEXTINPUT and focused_idx is not None:
                cell = cells[focused_idx]
                # Append the committed text from IME
                if event.text:
                    # limit length to keep UI tidy
                    if len(cell.text) + len(event.text) <= 40:
                        cell.text += event.text

        # Shuffle animation
        if shuffling:
            shuffle_timer += dt
            if shuffle_timer >= SHUFFLE_INTERVAL_MS:
                shuffle_timer = 0
                names = get_nonempty_names()
                if names:
                    shuffled_order = names[:]
                    random.shuffle(shuffled_order)
                else:
                    shuffling = False

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
