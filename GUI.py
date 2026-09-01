# -*- coding: utf-8 -*-
"""
Created on Tue Aug 25 21:13:00 2026

@author: eneso"""
#GUI

import tkinter as tk
from tkinter import messagebox, filedialog
import json
import re


COLOR_HEADER_BG = "#4472C4"
COLOR_HEADER_FG = "#FFFFFF"
COLOR_CELL_BG = "#FFFFFF"
COLOR_CELL_BORDER = "#B4C6E7"
COLOR_SELECTED = "#D6E4F0"
COLOR_SELECTED_BORDER = "#2F5496"
COLOR_SCHEMATIC_BG = "#F2F7FC"
COLOR_TAB_ACTIVE = "#FFFFFF"
COLOR_TAB_INACTIVE = "#D6E4F0"
COLOR_TAB_BAR = "#4472C4"
COLOR_STATUS_BG = "#2F5496"

COLOR_PIPE = "#DEEAF6"
COLOR_PUMP = "#BDD7EE"
COLOR_NODE = "#FFF2CC"
COLOR_GROUND = "#F2F2F2"
COLOR_WIRE = "#E2EFDA"
COLOR_PTU = "#FCE4D6"


class HydroGUI:

    def __init__(self, root, network=None):
        self.Root = root
        self.Root.title("HYDRO_BLAST")
        self.Root.geometry("1400x750")
        self.Root.configure(bg="#E8E8E8")

        self.Net = network
        self.GridData = {}
        self.Selected = (4, 2)
        self.Cells = {}
        self.Nrow = 25
        self.Ncol = 31
        self.SchemR1 = 4
        self.SchemR2 = 21
        self.SchemC1 = 2
        self.SchemC2 = 31
        self.ActiveSheet = "Comp"

        self.BuildFormulaBar()
        self.BuildGrid()
        self.BuildSheetTabs()
        self.BuildStatusBar()
        self.SelectCell(4, 2)

    def BuildFormulaBar(self):
        bar = tk.Frame(self.Root, bg="#F0F0F0", bd=0)
        bar.pack(fill="x")

        self.CellRefVar = tk.StringVar(value="B4")
        tk.Entry(bar, textvariable=self.CellRefVar, width=7,
                 font=("Consolas", 11), justify="center",
                 state="readonly", readonlybackground="#F0F0F0",
                 relief="flat", bd=1).pack(side="left", padx=(8, 0), pady=3)

        tk.Frame(bar, width=1, bg="#B0B0B0").pack(side="left", fill="y", padx=4, pady=3)

        self.FormulaVar = tk.StringVar()
        self.FormulaEntry = tk.Entry(bar, textvariable=self.FormulaVar,
                                      font=("Segoe UI", 11), relief="flat", bd=1)
        self.FormulaEntry.pack(side="left", fill="x", expand=True, padx=(0, 8), pady=3)
        self.FormulaEntry.bind("<Return>", self.CommitFormula)
        self.FormulaEntry.bind("<Escape>", self.CancelFormula)
        self.FormulaEntry.bind("<Tab>", self.TabToNext)

    def BuildGrid(self):
        container = tk.Frame(self.Root, bg="white")
        container.pack(fill="both", expand=True)

        xscroll = tk.Scrollbar(container, orient="horizontal")
        yscroll = tk.Scrollbar(container, orient="vertical")
        self.Canvas = tk.Canvas(container, bg="white",
                                 xscrollcommand=xscroll.set,
                                 yscrollcommand=yscroll.set)
        xscroll.config(command=self.Canvas.xview)
        yscroll.config(command=self.Canvas.yview)
        yscroll.pack(side="right", fill="y")
        xscroll.pack(side="bottom", fill="x")
        self.Canvas.pack(fill="both", expand=True)

        self.Inner = tk.Frame(self.Canvas, bg="white")
        self.Canvas.create_window((0, 0), window=self.Inner, anchor="nw")

        tk.Label(self.Inner, text="", width=4, bg=COLOR_HEADER_BG,
                 fg=COLOR_HEADER_FG, relief="flat",
                 font=("Segoe UI", 9)).grid(row=0, column=0, sticky="nsew")

        for c in range(1, self.Ncol + 1):
            tk.Label(self.Inner, text=self.ColLetter(c), width=12,
                     bg=COLOR_HEADER_BG, fg=COLOR_HEADER_FG, relief="flat",
                     font=("Segoe UI", 9, "bold")
                     ).grid(row=0, column=c, sticky="nsew")

        for r in range(1, self.Nrow + 1):
            tk.Label(self.Inner, text=str(r), width=4,
                     bg=COLOR_HEADER_BG, fg=COLOR_HEADER_FG, relief="flat",
                     font=("Segoe UI", 9, "bold")
                     ).grid(row=r, column=0, sticky="nsew")

            for c in range(1, self.Ncol + 1):
                inSchem = (self.SchemR1 <= r <= self.SchemR2 and
                           self.SchemC1 <= c <= self.SchemC2)
                bg = COLOR_SCHEMATIC_BG if inSchem else COLOR_CELL_BG

                lbl = tk.Label(self.Inner, text="", bg=bg,
                               relief="solid", bd=0,
                               font=("Consolas", 9), anchor="center",
                               width=12, height=1,
                               highlightthickness=1,
                               highlightbackground=COLOR_CELL_BORDER)
                lbl.grid(row=r, column=c, sticky="nsew", padx=0, pady=0)
                lbl.bind("<Button-1>", lambda e, r=r, c=c: self.SelectCell(r, c))
                lbl.bind("<Double-Button-1>", lambda e, r=r, c=c: self.EditCell(r, c))
                self.Cells[(r, c)] = lbl

        self.Inner.update_idletasks()
        self.Canvas.config(scrollregion=self.Canvas.bbox("all"))

        self.Root.bind("<Up>", lambda e: self.MoveSelection(-1, 0))
        self.Root.bind("<Down>", lambda e: self.MoveSelection(1, 0))
        self.Root.bind("<Left>", lambda e: self.MoveSelection(0, -1))
        self.Root.bind("<Right>", lambda e: self.MoveSelection(0, 1))
        self.Root.bind("<Delete>", lambda e: self.DeleteCell())
        self.Root.bind("<Key>", self.OnKeyPress)

    def BuildSheetTabs(self):
        tabBar = tk.Frame(self.Root, bg=COLOR_TAB_BAR, height=26)
        tabBar.pack(fill="x")

        sheets = ["Comp", "QuickRef", "QRFrictCoeff", "QRUnivComp",
                  "SchematicParking", "ISO8575"]

        for name in sheets:
            bg = COLOR_TAB_ACTIVE if name == self.ActiveSheet else COLOR_TAB_INACTIVE
            btn = tk.Label(tabBar, text=name, bg=bg, fg="#1a1a1a",
                           font=("Segoe UI", 9), padx=12, pady=2,
                           relief="flat", bd=0, cursor="hand2")
            btn.pack(side="left", padx=(1, 0), pady=(2, 0))
            btn.bind("<Button-1>", lambda e, n=name: self.SwitchSheet(n))

        tk.Button(tabBar, text="▶ Compute", bg="#2F5496", fg="white",
                  font=("Segoe UI", 9, "bold"), relief="flat", padx=14, pady=1,
                  cursor="hand2", command=self.Compute
                  ).pack(side="right", padx=8, pady=2)

    def BuildStatusBar(self):
        sb = tk.Frame(self.Root, bg=COLOR_STATUS_BG, height=22)
        sb.pack(fill="x")
        self.StatusVar = tk.StringVar(value="Bereit")
        tk.Label(sb, textvariable=self.StatusVar, bg=COLOR_STATUS_BG,
                 fg="white", font=("Segoe UI", 9), anchor="w"
                 ).pack(side="left", padx=8)

    def ColLetter(self, c):
        if c <= 26:
            return chr(64 + c)
        return chr(64 + (c - 1) // 26) + chr(64 + (c - 1) % 26 + 1)

    def CellName(self, r, c):
        return f"{self.ColLetter(c)}{r}"

    def CellColor(self, val):
        if not val:
            return None
        v = val.strip()
        if not v:
            return None
        vu = v.upper()
        if vu.startswith("UPT") or vu.startswith("UPM"):
            return COLOR_PTU
        h = v[0]
        if h == "P":
            return COLOR_PUMP
        if h in ("R", "U"):
            return COLOR_PIPE
        if h == "N":
            return COLOR_NODE
        if h == "S":
            return COLOR_GROUND
        if v in ("I", "W", "F", "T", "V"):
            return COLOR_WIRE
        return None

    def SelectCell(self, r, c):
        oldR, oldC = self.Selected
        self.RefreshCell(oldR, oldC)
        self.Selected = (r, c)
        lbl = self.Cells.get((r, c))
        if lbl:
            lbl.config(highlightbackground=COLOR_SELECTED_BORDER,
                       highlightthickness=2, bg=COLOR_SELECTED)
        self.CellRefVar.set(self.CellName(r, c))
        self.FormulaVar.set(self.GridData.get((r, c), ""))

    def EditCell(self, r, c):
        self.SelectCell(r, c)
        self.FormulaEntry.focus_set()
        self.FormulaEntry.select_range(0, "end")

    def CommitFormula(self, event=None):
        r, c = self.Selected
        val = self.FormulaVar.get().strip()
        if val:
            self.GridData[(r, c)] = val
        elif (r, c) in self.GridData:
            del self.GridData[(r, c)]
        self.RefreshCell(r, c)
        self.MoveSelection(1, 0)
        self.UpdateStatus()

    def CancelFormula(self, event=None):
        r, c = self.Selected
        self.FormulaVar.set(self.GridData.get((r, c), ""))

    def TabToNext(self, event=None):
        self.CommitFormula()
        self.MoveSelection(0, 1)
        return "break"

    def DeleteCell(self):
        r, c = self.Selected
        if (r, c) in self.GridData:
            del self.GridData[(r, c)]
        self.FormulaVar.set("")
        self.RefreshCell(r, c)
        self.UpdateStatus()

    def RefreshCell(self, r, c):
        lbl = self.Cells.get((r, c))
        if not lbl:
            return
        val = self.GridData.get((r, c), "")
        inSchem = (self.SchemR1 <= r <= self.SchemR2 and
                   self.SchemC1 <= c <= self.SchemC2)
        bg = self.CellColor(val)
        if bg is None:
            bg = COLOR_SCHEMATIC_BG if inSchem else COLOR_CELL_BG
        lbl.config(text=val, bg=bg, highlightbackground=COLOR_CELL_BORDER,
                   highlightthickness=1)

    def MoveSelection(self, dr, dc):
        if self.Root.focus_get() == self.FormulaEntry and dr == 0:
            return
        r, c = self.Selected
        nr, nc = r + dr, c + dc
        if 1 <= nr <= self.Nrow and 1 <= nc <= self.Ncol:
            self.SelectCell(nr, nc)

    def OnKeyPress(self, event):
        if event.widget == self.FormulaEntry:
            return
        if event.char and event.char.isprintable() and len(event.char) == 1:
            self.FormulaVar.set("")
            self.EditCell(*self.Selected)

    def SwitchSheet(self, name):
        self.ActiveSheet = name
        self.StatusVar.set(f"Sheet: {name}")

    def Compute(self):
        comps = 0
        nodes = set()
        for (r, c), val in self.GridData.items():
            if not (self.SchemR1 <= r <= self.SchemR2 and
                    self.SchemC1 <= c <= self.SchemC2):
                continue
            v = val.strip()
            if v and v[0] in ("R", "P", "U"):
                comps += 1
            if v and v[0] == "N":
                try:
                    nodes.add(int(v[1:].split()[0]))
                except ValueError:
                    pass
        maxN = max(nodes) if nodes else 0
        msg = (f"{comps} Komponenten\n"
               f"{len(nodes)} Knoten (N01–N{maxN:02d})\n\n"
               f"Solver einbinden: siehe Compute()-Methode")
        messagebox.showinfo("Compute", msg)
        self.StatusVar.set(f"{comps} Komp., {len(nodes)} Knoten")

    def UpdateStatus(self):
        comps = sum(1 for (r, c), v in self.GridData.items()
                    if v and v[0] in "RPU"
                    and self.SchemR1 <= r <= self.SchemR2
                    and self.SchemC1 <= c <= self.SchemC2)
        nodes = sum(1 for (r, c), v in self.GridData.items()
                    if v and v[0] == "N"
                    and self.SchemR1 <= r <= self.SchemR2
                    and self.SchemC1 <= c <= self.SchemC2)
        self.StatusVar.set(f"Schematic: {comps} Komp., {nodes} Knoten")


if __name__ == "__main__":
    root = tk.Tk()
    app = HydroGUI(root, network=None)
    root.mainloop()