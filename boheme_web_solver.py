"""
BOHEME web compatibility adapter.

Bachelorthesis.py remains the hydraulic solver.
This file only adapts the browser schematic to it
and fixes known interface/parsing inconsistencies.
"""

from Bachelorthesis import (
    Network as ThesisNetwork,
    Component,
    PA_PER_BAR,
    GROUND,
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
    KIND_UPT,
    KIND_UPM,
)


class WebNetwork(ThesisNetwork):

    # ---------------------------------------------------------
    # Parameters
    # ---------------------------------------------------------

    def ReadParameters(self):
        """
        Parameters are already assigned by index3D.html
        before the solver is started.
        """
        return None


    # ---------------------------------------------------------
    # Connections
    # ---------------------------------------------------------

    def IsWire(self, head):
        """
        Original thesis schematic:
        I, W, F, T, V

        Browser GUI additionally uses:
        -
        """

        if not head:
            return False

        return str(head).upper() in {
            "I",
            "W",
            "F",
            "T",
            "V",
            "-"
        }
    # ---------------------------------------------------------
    # Component recognition
    # ---------------------------------------------------------

    def ComponentKind(self, componentName):
        """
        Case-insensitive recognition.

        Important for names such as:
        Rl_F
        Ucv1
        Upt1a
        Upm1
        etc.
        """

        name = str(componentName).upper()

        if name.startswith(KIND_RZ):
            return KIND_RZ

        if name.startswith(KIND_RK):
            return KIND_RK

        if name.startswith(KIND_RR):
            return KIND_RR

        if name.startswith(KIND_RL):
            return KIND_RL

        if name.startswith(KIND_UCP):
            return KIND_UCP

        if name.startswith(KIND_UPR):
            return KIND_UPR

        if name.startswith(KIND_UCV):
            return KIND_UCV

        if name.startswith(KIND_UPT):
            return KIND_UPT

        if name.startswith(KIND_UPM):
            return KIND_UPM

        if name.startswith(KIND_R):
            return KIND_R

        if name.startswith(KIND_P):
            return KIND_P

        if name.startswith(KIND_U):
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
        Component physics/parser:
        original Bachelorthesis.py

        Network connection search:
        web-compatible functions below
        """

        self.Ncomp += 1

        self.Comp.append(
            Component()
        )

        c = self.Comp[-1]


        self.ParseComponent(
            c,
            cellText,
            rowIdx,
            colIdx
        )


        # Bachelorthesis parser writes DPoc,
        # later calculations use Dpoc.
        if hasattr(c, "DPoc"):
            c.Dpoc = c.DPoc


        self.FindConnectedNodes(c)


    # ---------------------------------------------------------
    # Find connected nodes
    # ---------------------------------------------------------

    def FindConnectedNodes(self, c):

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


            if not cell_content:
                continue


            head = (
                cell_content[0]
            )


            # Node immediately next to component
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


            # Connection line
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


            # Anything else is not considered
            # a connection in this direction.
            else:
                continue


            if slot[0] >= 2:
                break


        self.EnsureTwoConnectedNodes(
            c,
            slot[0]
        )


    # ---------------------------------------------------------
    # Walk along connection
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


            if not cell_content:
                return


            head = (
                cell_content[0]
            )


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


            # Another unrelated spreadsheet
            # element was encountered.
            return


    # ---------------------------------------------------------
    # Register node
    # ---------------------------------------------------------

    def RegisterFoundNode(
        self,
        c,
        scanDir,
        ii,
        jj,
        slot,
        foundNr
    ):

        slot[0] += 1


        if slot[0] > 2:
            return


        if slot[0] == 1:

            c.orient = (
                self.OrientFromScan(
                    scanDir
                )
            )


        cell_content = str(
            self.Schematic[
                ii - 1
            ][
                jj - 1
            ]
        ).strip()


        # Robust against multiple spaces.
        parts = (
            cell_content.split()
        )


        self.AssignNode(
            c,
            slot[0],
            parts,
            ii,
            jj,
            foundNr
        )


    # ---------------------------------------------------------
    # Correct node parser
    # ---------------------------------------------------------

    def AssignNode(
        self,
        c,
        slot,
        t,
        ii,
        jj,
        foundNr
    ):
        """
        Correct interpretation:

        N01 -> 1
        N02 -> 2
        N09 -> 9
        N10 -> 10
        N17 -> 17
        N29 -> 29
        N36 -> 36

        Nr01 -> pressure node 1

        S -> ground
        """

        if not t:

            raise Exception(
                f"Empty node token at "
                f"row {ii}, column {jj}."
            )


        nm = (
            str(t[0]).strip()
        )


        hasZ = (
            len(t) >= 2
            and
            str(t[1]).strip() != ""
        )


        isGround = (
            nm.upper() == "S"
        )


        isNr = (
            nm.lower().startswith(
                "nr"
            )
        )


        z = 0.0

        nrP = 0.0

        idx = 0


        # -----------------------------------------------------
        # Ground
        # -----------------------------------------------------

        if isGround:

            idx = GROUND


            if hasZ:

                z = float(
                    t[1]
                )


        # -----------------------------------------------------
        # Pressure node NrXX
        # -----------------------------------------------------

        elif isNr:

            suffix = (
                nm[2:]
            )


            if not suffix.isdigit():

                raise Exception(
                    f"Invalid pressure node "
                    f"name '{nm}'. "
                    f"Expected Nr01, Nr02, ..."
                )


            idx = int(
                suffix
            )


            if hasZ:

                nrP = (
                    float(t[1])
                    *
                    PA_PER_BAR
                )


            if foundNr[0]:

                raise Exception(
                    "only a single total "
                    "pressure node 'Nrxx' "
                    "may be connected to a "
                    "pressure regulating "
                    "component."
                )


            foundNr[0] = True


        # -----------------------------------------------------
        # Normal node NXX
        # -----------------------------------------------------

        else:

            if not nm.upper().startswith(
                "N"
            ):

                raise Exception(
                    f"Invalid node name "
                    f"'{nm}'. "
                    f"Expected N01, N02, "
                    f"... or S."
                )


            # IMPORTANT:
            #
            # N29 -> nm[1:] -> "29"
            #
            # NOT nm[2:] -> "9"

            suffix = (
                nm[1:]
            )


            if not suffix.isdigit():

                raise Exception(
                    f"Invalid node name "
                    f"'{nm}'. "
                    f"Expected N01, N02, ..."
                )


            idx = int(
                suffix
            )


            if hasZ:

                z = float(
                    t[1]
                )


        # -----------------------------------------------------
        # Track highest node number
        # -----------------------------------------------------

        if idx > self.Max_Idx:

            self.Max_Idx = idx


        # -----------------------------------------------------
        # Assign side 1 / side 2
        # -----------------------------------------------------

        if slot == 1:

            c.Nam1 = nm

            c.n1 = idx

            c.Z1 = z

            c.NrP1 = nrP

            c.Ri1 = ii

            c.Cj1 = jj


        else:

            c.Nam2 = nm

            c.n2 = idx

            c.Z2 = z

            c.NrP2 = nrP

            c.Ri2 = ii

            c.Cj2 = jj


    # ---------------------------------------------------------
    # Solver
    # ---------------------------------------------------------

    def RunSolver(self):

        super().RunSolver()

        self.liter = (
            self.Iiter
        )
