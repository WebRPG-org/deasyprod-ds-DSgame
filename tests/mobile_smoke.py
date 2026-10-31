"""Browser regression checks against a running game; no game-state injection.

Usage: python3 tests/mobile_smoke.py [--url http://127.0.0.1:8000]
Requires Python Playwright and system Chromium. Artifacts default to /tmp.
"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:8000')
parser.add_argument('--artifacts', default='/tmp/last-lift-artifacts')
parser.add_argument('--chromium', default='/usr/bin/chromium', help='Chromium path, or playwright for its managed browser')
args = parser.parse_args()
artifacts = Path(args.artifacts)
artifacts.mkdir(parents=True, exist_ok=True)
reports = []


def launch_page(browser, width=390, height=844, mobile=True):
    context = browser.new_context(
        viewport={'width': width, 'height': height},
        is_mobile=mobile, has_touch=mobile, device_scale_factor=2 if mobile else 1,
    )
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('response', lambda r: errors.append(f'HTTP {r.status}: {r.url}') if r.status >= 400 else None)
    response = page.goto(args.url, wait_until='load')
    assert response.status == 200
    page.wait_for_function("typeof Scene_LastLift !== 'undefined' && SceneManager._scene instanceof Scene_LastLift && SceneManager._scene.isActive()")
    assert 'Последний лифт' in page.title()
    return context, page, errors


def tap(page, action):
    button = page.locator(f'[data-action="{action}"]')
    expect(button).to_be_enabled()
    if page.evaluate('navigator.maxTouchPoints > 0'):
        button.tap()
    else:
        button.click()
    page.wait_for_function('SceneManager._scene._travel === 0')


def node(page, expected):
    page.wait_for_function('name => SceneManager._scene.state?.node === name', arg=expected)


def state(page):
    return page.evaluate('SceneManager._scene.state')


def travel(page, floor):
    tap(page, 'nav:panel')
    tap(page, f'travel:{floor}')
    node(page, f'f{floor}')


def start(page, girl=True):
    for action in ['start', 'wake', 'listen', 'invite' if girl else 'leave']:
        tap(page, action)
    node(page, 'cabin')


def clean(page, errors):
    assert not errors, errors
    assert page.locator('#ErrorPrinter').inner_text() == ''
    assert page.evaluate('Graphics.hasWebGL()')
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    # Every actual control stays within the visible viewport.
    for button in page.locator('#last-lift-controls button').all():
        box = button.bounding_box()
        if box:
            assert box['x'] >= -1 and box['y'] >= -1, box
            assert box['x'] + box['width'] <= page.viewport_size['width'] + 1, box
            assert box['y'] + box['height'] <= page.viewport_size['height'] + 1, box


with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=None if args.chromium == 'playwright' else args.chromium, headless=True,
        args=['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'],
    )
    try:
        for ending, girl in [('together', True), ('alone', False), ('keeper', True)]:
            context, page, errors = launch_page(browser)
            if ending == 'together':
                page.screenshot(path=str(artifacts / 'title.png'))
            start(page, girl)
            travel(page, 1)
            if ending == 'together':
                page.screenshot(path=str(artifacts / 'snow.png'))
                tap(page, 'bench')
                tap(page, 'floor')
                tap(page, 'fuse')
                tap(page, 'nav:cabin')
                tap(page, 'maintenance')
                tap(page, 'repair')
                assert state(page)['flags']['upgraded']
                tap(page, 'nav:cabin')
                tap(page, 'talk')
                tap(page, 'promise')
                tap(page, 'sound')
                expect(page.locator('[data-action="sound"]')).to_have_attribute('aria-label', 'ЗВУК: ВКЛ')
                tap(page, 'sound')
            travel(page, 7)
            tap(page, 'takeKey' if ending == 'together' else 'takeMemory')
            travel(page, 13)
            if ending == 'together':
                page.screenshot(path=str(artifacts / 'garden.png'))
            tap(page, 'water' if ending != 'alone' else 'harvest')
            travel(page, 0)
            tap(page, 'share' if ending != 'alone' else 'trade')
            if ending == 'together':
                tap(page, 'nav:journal')
                expect(page.locator('[data-action="journal:next"]')).to_be_enabled()
                tap(page, 'journal:next')
                tap(page, 'journal:prev')
                saved = state(page)
                page.reload(wait_until='load')
                tap(page, 'start')
                assert state(page) == saved, 'Reload lost progression or inventory'
                tap(page, 'nav:panel')
                page.screenshot(path=str(artifacts / 'panel.png'))
            travel(page, 108)
            tap(page, {'together': 'endTogether', 'alone': 'endAlone', 'keeper': 'endKeeper'}[ending])
            node(page, 'ending')
            assert state(page)['ending'] == ending
            clean(page, errors)
            page.screenshot(path=str(artifacts / f'ending-{ending}.png'))
            tap(page, 'title')
            tap(page, 'new')
            tap(page, 'cancelNew')
            assert state(page)['ending'] == ending, 'Cancelled restart changed the save'
            tap(page, 'new')
            tap(page, 'confirmNew')
            node(page, 'intro')
            assert state(page)['log'] == []
            reports.append({'scenario': ending, 'viewport': '390x844', 'errors': errors})
            context.close()

        context, page, errors = launch_page(browser, 360, 740)
        start(page, False)
        for floor in [7, 1, 7, 1, 7]:
            travel(page, floor)
        assert state(page)['power'] == 0
        tap(page, 'nav:panel')
        expect(page.locator('[data-action="travel:1"]')).to_be_disabled()
        tap(page, 'nav:cabin')
        tap(page, 'maintenance')
        tap(page, 'crank')
        assert state(page)['power'] == 2
        travel(page, 1)
        clean(page, errors)
        page.screenshot(path=str(artifacts / 'small-phone.png'))
        page.set_viewport_size({'width': 740, 'height': 360})
        expect(page.locator('#rotate-phone')).to_be_visible()
        page.set_viewport_size({'width': 360, 'height': 740})
        expect(page.locator('#rotate-phone')).not_to_be_visible()
        tap(page, 'nav:cabin')
        node(page, 'cabin')
        reports.append({'scenario': 'empty-battery-and-rotation', 'viewport': '360x740', 'errors': errors})
        context.close()

        context, page, errors = launch_page(browser, 1280, 900, mobile=False)
        page.keyboard.press('Tab')
        page.keyboard.press('Enter')
        node(page, 'intro')
        for expected in ['hand', 'invitation', 'cabin']:
            page.keyboard.press('1')
            node(page, expected)
        tap(page, 'panel')
        tap(page, 'travel:7')
        clean(page, errors)
        page.screenshot(path=str(artifacts / 'desktop.png'))
        reports.append({'scenario': 'desktop-keyboard-and-mouse', 'viewport': '1280x900', 'errors': errors})
        context.close()

        # Corrupted save must still offer a working new game.
        context, page, errors = launch_page(browser)
        page.evaluate("localStorage.setItem('dsgame.last-lift.episode-1.v1', '{broken')")
        page.reload(wait_until='load')
        start(page)
        clean(page, errors)
        reports.append({'scenario': 'corrupt-save-recovery', 'errors': errors})
        context.close()
    finally:
        browser.close()

(artifacts / 'report.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(reports), 'scenarios': reports, 'artifacts': str(artifacts)}, ensure_ascii=False, indent=2))
