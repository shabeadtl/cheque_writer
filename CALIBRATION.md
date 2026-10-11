# Calibration Guide

**WARNING: The default layout settings in this application are PLACEHOLDERS.**
You MUST calibrate the application against a genuine National Bank of Oman (NBO) blank cheque and your specific physical printer before using this software in production.

## Why Calibration is Necessary

Printers have different hardware margins, feed mechanisms, and scaling behaviors. Cheque stock can also vary slightly. The application provides CSS-level precise positioning, but the coordinates must match your physical reality.

## Step-by-Step Calibration Workflow

### Phase 1: Printer Verification (Plain Paper)

1. **Print the Calibration Grid**
   - Open the application and go to the **Calibrate** tab.
   - Insert a standard sheet of plain paper (A4) into your printer.
   - Click **Print Grid**.
   
2. **Verify Printer Scaling**
   - Take a physical ruler and measure the printed grid.
   - The grid squares should be exactly 10mm x 10mm.
   - The distance from the `0` line to the `100` line must be exactly 100mm (10cm).
   - If the measurements are incorrect, your printer driver is scaling the output (e.g., "Fit to Page" is enabled).
   - Go to the **Printer** tab and adjust the **Print Scale (%)** setting until the grid prints at exactly 100% scale.

### Phase 2: Cheque Alignment (Light Table Method)

1. **Print the Ruler on Plain Paper**
   - In the **Calibrate** tab, click **Print Ruler** onto plain paper.

2. **Overlay with a Blank Cheque**
   - Place the printed ruler page on a light table, or hold it up against a bright window.
   - Place a genuine blank NBO cheque directly over the printed ruler.
   - Align the top-left corner of the cheque exactly with the `(0, 0)` mark on the printed ruler.

3. **Measure Field Coordinates**
   - Look through the cheque at the ruler grid behind it.
   - Note the exact X and Y coordinates (in millimeters) where the following fields should begin:
     - Date
     - Payee Name
     - Amount in Figures (box)
     - Amount in Words (lines 1 and 2)

4. **Update Application Layout**
   - Go to the **Layout** tab in the application.
   - Expand each field and enter the X and Y coordinates you measured.
   - Adjust the **Max Width** to fit the available space on the cheque.
   - Adjust **Font Size** as desired.
   - Click **Save Layout**.

### Phase 3: Final Verification

1. **Test Print (Plain Paper)**
   - Go to the **Write Cheque** tab.
   - Enter test details (e.g., Payee: "TEST CALIBRATION", Amount: "1234.500").
   - Click **Test Print** onto plain paper.
   - Overlay the printed test onto a blank cheque using the light table method to verify alignment.

2. **Live Test (Actual Cheque)**
   - Only when you are 100% satisfied with the alignment on plain paper, insert a genuine cheque into the printer.
   - Make sure you insert the cheque in the correct orientation (face up/down, leading edge) according to your printer's manual.
   - Click **Print Cheque**.

## Fine-Tuning

If the entire print is slightly shifted (e.g., 2mm too far to the right), you do not need to edit every single field.
Instead, use the **Calibration Offsets (mm)** in the **Layout** tab:
- **X Offset**: Positive values move everything Right, negative values move everything Left.
- **Y Offset**: Positive values move everything Down, negative values move everything Up.

*Save your settings after making any adjustments.*
