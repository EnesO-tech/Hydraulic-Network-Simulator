"""Web adapter for the original Bachelorthesis.Network solver.

Keeps the thesis solver as the source of truth, while correcting a few
interface/refactor issues that prevent the uploaded version from running in a
browser/Pyodide context.
"""
from Bachelorthesis import Network as ThesisNetwork


class WebNetwork(ThesisNetwork):
    """Thin compatibility layer around the thesis solver."""

    def ReadParameters(self):
        """Parameters are supplied by the web GUI before Solve() is called."""
        # The uploaded thesis file calls ReadParameters(), but does not define
        # the method. In the existing Tk GUI the parameters are assigned on the
        # Network object immediately before the solver call, so no grid read is
        # required here.
        return None

    def WalkConnectionUntilNode(self, c, scanDir, iiStart, jjStart, slot, foundNr):
        """Follow a straight schematic connection until a node is reached.

        The uploaded solver's StepAlongConnection() tries to mutate integers
        with ii[0]/jj[0]. Python integers are immutable, so the indices never
        advance correctly. This method implements the same intended algorithm
        with local integer updates.
        """
        ii = iiStart
        jj = jjStart

        while self.InGrid(ii, jj):
            cell_content = self.Schematic[ii - 1][jj - 1]
            head = cell_content[0] if cell_content else ""

            if self.IsNodeToken(head):
                self.RegisterFoundNode(c, scanDir, ii, jj, slot, foundNr)
                return

            if self.IsWire(head):
                ii += self.RowStep(scanDir)
                jj += self.ColStep(scanDir)
                continue

            self.RaiseSchematicTopologyError(c, ii, jj)
            return

    def AddComponent(self, cellText, rowIdx, colIdx):
        super().AddComponent(cellText, rowIdx, colIdx)
        c = self.Comp[-1]
        # In the uploaded thesis file the parsers write c.DPoc, whereas the
        # check-valve/result code reads the dataclass field c.Dpoc.
        if hasattr(c, "DPoc"):
            c.Dpoc = c.DPoc

    def RunSolver(self):
        super().RunSolver()
        # The original GUI displays `liter`, while the solver increments Iiter.
        self.liter = self.Iiter
