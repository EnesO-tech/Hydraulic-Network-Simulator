"""
BOHEME Web Adapter
==================

Browser compatibility layer for the original Bachelorthesis.py solver.

IMPORTANT:
- The hydraulic equations remain in Bachelorthesis.py.
- This file only adapts schematic parsing for the browser GUI.
"""

from Bachelorthesis import (
    Network as ThesisNetwork,
    Component,
    KIND_R,
    KIND_RZ,
    KIND_RK,
    KIND_RR,
    KIND_RL,
    KIND_P,
    KIND_U,
    KIND_UCP,
    KIND_UPR,
    KIND_UCV,
)


class WebNetwork(ThesisNetwork):

    # ---------------------------------------------------------
    # Parameters are already supplied by the HTML/Pyodide GUI
    # ---------------------------------------------------------

    def ReadParameters(self):
        return None


    # ---------------------------------------------------------
    # Browser schematic connector tokens
    # ---------------------------------------------------------

    def IsWire(self, head):
        """
        Original solver accepts:
        I, W, F, T, V

        BOHEME browser schematic additionally uses:
        -
        """

        if head is None:
            return False

        return str(head).upper() in [
            "I",
            "W",
            "F",
            "T",
            "V",
            "-"
        ]


    # ---------------------------------------------------------
    # Case-insensitive component detection
    # ---------------------------------------------------------

    def ComponentKind(self, componentName):

        name = str(componentName).upper()

        if name.startswith(KIND_RZ):
            return KIND_RZ

        elif name.startswith(KIND_RK):
            return KIND_RK

        elif name.startswith(KIND_RR):
            return KIND_RR

        elif name.startswith(KIND_RL):
            return KIND_RL

        elif name.startswith(KIND_UCP):
            return KIND_UCP

        elif name.startswith(KIND_UPR):
            return KIND_UPR

        elif name.startswith(KIND_UCV):
            return KIND_UCV

        elif name.startswith(KIND_R):
            return KIND_R

        elif name.startswith(KIND_P):
            return KIND_P

        elif name.startswith(KIND_U):
            return KIND_U

        return ""


    # ---------------------------------------------------------
    # Component creation
    # ---------------------------------------------------------

    def AddComponent(
        self,
        cellText,
        rowIdx,
        colIdx
    ):
        """
        We deliberately do NOT call super().AddComponent() here.

        The original AddComponent immediately calls its strict
        FindConnectedNodes implementation.

        Instead:
        1. create component
        2. parse component with original thesis parser
        3. determine topology using the web-compatible parser
        """

        self.Ncomp += 1

        self.Comp.append(
            Component()
        )

        c = self.Comp[-1]


        # Original parser from Bachelorthesis.py
        self.ParseComponent(
            c,
            cellText,
            rowIdx,
            colIdx
        )


        # Compatibility:
        # some parsers write c.DPoc while later solver code
        # reads c.Dpoc
        if hasattr(c, "DPoc"):
            c.Dpoc = c.DPoc


        # Web-compatible topology parser
        self.FindConnectedNodes(c)


    # ---------------------------------------------------------
    # Robust topology search
    # ---------------------------------------------------------

    def FindConnectedNodes(self, c):
        """
        Search for the two nodes connected to a component.

        Important difference from the thesis implementation:

        Irrelevant neighbouring cells are ignored instead of
        immediately causing an exception.

        This is necessary because the browser grid also contains
        parameter cells and other spreadsheet content.
        """

        slot = [0]

        foundNr = [False]

        startDir = self.StartDirection(
            c.orient
        )


        for offset in range(4):

            scanDir = (
                startDir +
                offset
            )

            if scanDir > 4:
                scanDir -= 4


            ii = (
                c.Row +
                self.RowStep(
                    scanDir
                )
            )

            jj = (
                c.Col +
                self.ColStep(
                    scanDir
                )
            )


            if not self.InGrid(
                ii,
                jj
            ):
                continue


            cell_content = str(
                self.Schematic[
                    ii - 1
                ][
                    jj - 1
                ]
            ).strip()


            # Empty neighbour:
            # nothing connected in this direction
            if not cell_content:
                continue


            head = (
                cell_content[0]
            )


            # Directly neighbouring node
            if self.IsNodeToken(
                head
            ):

                self.RegisterFoundNode(
                    c,
                    scanDir,
                    ii,
                    jj,
                    slot,
                    foundNr
                )


            # Wire / connector
            elif self.IsWire(
                head
            ):

                self.WalkConnectionUntilNode(
                    c,
                    scanDir,
                    ii,
                    jj,
                    slot,
                    foundNr
                )


            else:
                """
                IMPORTANT:

                The spreadsheet can contain numbers,
                parameters or unrelated components
                next to a component.

                They are not considered connections.
                """

                continue


            if slot[0] >= 2:
                break


        self.EnsureTwoConnectedNodes(
            c,
            slot[0]
        )


    # ---------------------------------------------------------
    # Walk along a straight connector
    # ---------------------------------------------------------

    def WalkConnectionUntilNode(
        self,
        c,
        scanDir,
        iiStart,
        jjStart,
        slot,
        foundNr
    ):

        ii = iiStart
        jj = jjStart


        # Safety limit
        max_steps = (
            self.Nrow +
            self.Ncol +
            4
        )


        for _ in range(
            max_steps
        ):

            if not self.InGrid(
                ii,
                jj
            ):
                return


            cell_content = str(
                self.Schematic[
                    ii - 1
                ][
                    jj - 1
                ]
            ).strip()


            # Connection ended before reaching a node
            if not cell_content:
                return


            head = (
                cell_content[0]
            )


            # Node found
            if self.IsNodeToken(
                head
            ):

                self.RegisterFoundNode(
                    c,
                    scanDir,
                    ii,
                    jj,
                    slot,
                    foundNr
                )

                return


            # Continue along connector
            if self.IsWire(
                head
            ):

                ii += self.RowStep(
                    scanDir
                )

                jj += self.ColStep(
                    scanDir
                )

                continue


            # Something unrelated encountered:
            # this direction is simply not a valid connection
            return


    # ---------------------------------------------------------
    # Solver
    # ---------------------------------------------------------

    def RunSolver(self):

        super().RunSolver()


        # Web interface expects this attribute
        self.liter = self.Iiter
