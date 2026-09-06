"""Browser compatibility adapter for BOHEME.

The original Bachelorthesis.py remains the hydraulic solver.
This adapter only fixes browser/schematic compatibility issues.
"""

from Bachelorthesis import Network as ThesisNetwork


class WebNetwork(ThesisNetwork):
    """Compatibility layer around the original thesis Network class."""

    def ReadParameters(self):
        """
        Parameters are already assigned by the HTML/Pyodide interface
        before the solver is started.
        """
        return None


    def IsWire(self, head):
        """
        The browser schematic also uses '-' as a visible connector.

        Original thesis solver:
        I, W, F, T, V

        Web GUI additionally:
        -
        """
        return head in [
            "I",
            "W",
            "F",
            "T",
            "V",
            "-"
        ]


    def WalkConnectionUntilNode(
        self,
        c,
        scanDir,
        iiStart,
        jjStart,
        slot,
        foundNr
    ):
        """
        Follow a straight schematic connection until a node is reached.

        This replaces the original StepAlongConnection implementation,
        which attempts to modify Python integers using ii[0] / jj[0].
        """

        ii = iiStart
        jj = jjStart

        # Safety guard against accidental endless scans.
        max_steps = self.Nrow + self.Ncol + 4
        steps = 0

        while self.InGrid(ii, jj):

            steps += 1

            if steps > max_steps:
                raise Exception(
                    f"Connection scan exceeded grid bounds "
                    f"for component '{c.Name}'."
                )

            cell_content = str(
                self.Schematic[ii - 1][jj - 1]
            ).strip()

            head = (
                cell_content[0]
                if cell_content
                else ""
            )

            # Node or ground reached
            if self.IsNodeToken(head):

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
            if self.IsWire(head):

                ii += self.RowStep(scanDir)
                jj += self.ColStep(scanDir)

                continue


            # Anything else really is a topology error
            raise Exception(
                f"Error in Schematic for component '{c.Name}' "
                f"at row {ii}, column {jj}: "
                f"connected element '{cell_content}' "
                f"found instead of a node or connector."
            )


    def AddComponent(
        self,
        cellText,
        rowIdx,
        colIdx
    ):
        """
        Let the thesis solver parse the component and determine
        its connected nodes.
        """

        super().AddComponent(
            cellText,
            rowIdx,
            colIdx
        )

        c = self.Comp[-1]

        # Compatibility fix:
        # parser writes DPoc while later code reads Dpoc.
        if hasattr(c, "DPoc"):
            c.Dpoc = c.DPoc


    def RunSolver(self):
        """
        Run the unchanged hydraulic solver.
        """

        super().RunSolver()

        # Existing web/result interface expects 'liter'.
        self.liter = self.Iiter
