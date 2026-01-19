import asyncio
import json
import os
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:5173"
PUZZLES_JSON_PATH = "../public/assets/puzzles.json"
OUTPUT_DIR = "../public/previews"

async def generate_previews():
    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Load puzzles
    with open(PUZZLES_JSON_PATH, 'r') as f:
        puzzles = json.load(f)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Set square viewport for better thumbnails
        await page.set_viewport_size({"width": 512, "height": 512})

        for puzzle in puzzles:
            puzzle_id = puzzle['id']
            output_path = os.path.join(OUTPUT_DIR, f"{puzzle_id}.png")
            
            if os.path.exists(output_path):
                print(f"Skipping {puzzle_id}, preview exists.")
                continue

            print(f"Generating preview for {puzzle_id}...")
            
            try:
                # Navigate with deep link
                url = f"{BASE_URL}/?puzzle={puzzle_id}"
                await page.goto(url)

                # Wait for canvas
                await page.wait_for_selector("canvas", state="visible")
                
                # Hide UI overlays to ensure clean screenshot
                await page.evaluate("""
                    const ui = document.querySelectorAll('.absolute');
                    ui.forEach(el => el.style.display = 'none');
                """)
                
                # Give it a moment to render/settle
                await page.wait_for_timeout(1000) 

                canvas = page.locator("canvas").first
                await canvas.screenshot(path=output_path)
                print(f"Saved to {output_path}")

            except Exception as e:
                print(f"Failed to generate {puzzle_id}: {e}")

        await browser.close()

if __name__ == "__main__":
    # Change working directory to script location to ensure relative paths work
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(generate_previews())
