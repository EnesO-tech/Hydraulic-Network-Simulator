# -*- coding: utf-8 -*-
"""
Created on Tue Aug 25 21:13:00 2026

@author: eneso
"""

from enum import IntEnum
from dataclasses import dataclass
from typing import List
import numpy as np



PA_PER_BAR: float=100000
S_PER_H: float=3600
MM_PER_M: float=1000
GROUND: int=0
N_OUT:int=60

KIND_R: str="R"
KIND_RZ: str="RZ"
KIND_RK: str="RK"
KIND_RR: str="RR"
KIND_RL: str="RL"      
KIND_P: str="P"      
KIND_U: str="U"       
KIND_UCP: str="UCP"     
KIND_UPR: str="UPR"     
KIND_UCV: str="UCV" 

class FlowTopology(IntEnum):
    TOPO_PUMP=1
    TOPO_GROUND_SIDE_2=2
    TOPO_GROUND_SIDE_1=3
    TOPO_INTERNAL=4

@dataclass 
class Component:
    Name:str=""
    kind:str=""
    PipeLen: float=0
    Diam:float=0
    Area:float=0
    Kd:float=0
    Zeta:float=0
    Kv:float=0
    Dpoc:float=0
    Qsc:float=0
    Rd:float=0
    orient:str=""
    
    n1:int=0
    n2:int=0
    Nam1:str=""
    Nam2:str=""
    Z1:float=0
    Z2:float=0
    NrP1:float=0
    NrP2:float=0
    Row:int=0
    Col:int=0
    Ri1:int=0
    Cj1:int=0
    Ri2:int=0
    Cj2:int=0
    
    U:float=0
    q:float=0
    Ptot1:float=0
    Ptot2:float=0
    Fwd: bool=True

class Network:
    def __init__(self):
        self.Schematic=[]
        self.Nrow: int=0
        self.Ncol: int=0
        self.Comp: List[Component]=[]
        self.Nnode: int=0
        self.Max_Idx: int=0
        self.Ncomp:int=0
        
        self.Mue: float=0
        self.Rho: float=0
        self.G: float=0
        self.Krough: float=0
        self.DUcrit: float=0
        self.NiterMax: int=0
        self.LambdaU: float=0
        self.KRelt:float=0
        self.Recrit: float=0
        self.Protect: bool=True
        self.Zanke: bool=True
        self.Pi: float=0
        
        self.X: List[float]=[]
        self.NodeName:List[str]=[]
        self.NodeZ: List[float]=[]
        self.A: List[List[float]]=[]
        self.B: List[float]=[]
        self.liter:int=0
        self.DUres: float=0
        self.DUresml: float=0.0
        self.Sheet: str=""
        
        self.OutRnam: List[str]=[]
        self.OutNn1: List[str]=[]
        self.OutNn2: List[str]=[]
        self.OutRval: List[float]=[]
        self.OutRd: List[float]=[]
        self.OutDPoc: List[float]=[]
        self.OutQsc: List[float]=[]
        self.OutLval:List[float]=[]        
        self.OutDval: List[float]=[]
        self.OutQ: List[float]=[]
        self.OutAbsQ: List[float]=[]
        self.OutU:List[float]=[]
        self.OutReD: List[float]=[]
        self.OutQdyn: List[float]=[]
        self.OutDP: List[float]=[]
        self.OutPow:List[float]=[]
        self.OutDiri: List[str]=[]
        self.OutIi1= []
        self.OutJj1= []
        self.OutIi2= []
        self.OutJj2= []
        self.OutI0= []
        self.OutJ0= []
        self.OutNum1: List[int]=[]
        self.OutNum2: List[int]=[]
        self.OutKv: List[float]=[]
        self.OutX: List[float]=[]
        self.OutPtmP: List[float]=[]
        self.OutNnam:List[str]=[]
        self.OutZ:List[float]=[]
    
    def Schematic_Netlist_CoefficientMatrix_Solve(self):
        
        try:
            self.ReadParameters()
            self.BuildNetlist()
            self.DetermineNodeCount()
            self.CheckNodeElevations()
            self.RunSolver()
            self.WriteResults()
            
                      
        except Exception as e:
            print(f"Fehler im Netzwerk-Solver: {e}")
            raise


    def BuildNetlist(self):
        
        self.Ncomp = 0
        self.Max_Idx = 0
        self.Comp = []
        
        for rowIdx in range(1, self.Nrow + 1):
            for colIdx in range(1, self.Ncol + 1):
                cellText = str(self.Schematic[rowIdx - 1][colIdx - 1])
                if self.IsComponentToken(cellText):
                    self.AddComponent(cellText, rowIdx, colIdx)
                    
        if self.Ncomp == 0:
            raise Exception("No component found")


    def IsComponentToken(self, cellText):
        
        head = cellText[0] if cellText else ""
        return (head == KIND_R or head == KIND_P or head == KIND_U)

    def AddComponent(self, cellText, rowIdx, colIdx):
        
        self.Ncomp+=1
        self.Comp.append(Component())
        self.ParseComponent(self.Comp[-1], cellText, rowIdx,colIdx)
        self.FindConnectedNodes(self.Comp[-1])
        
    def ParseComponent(self,c,cellText,i,j):
        
        t=cellText.split()
        self.InitialiseComponent(c, t[0],i,j)
        self.DispatchComponentParser(c,t)
        self.InitialiseComponentGeometry(c)
        
    
    def InitialiseComponent(self,c,componentName,i,j):
        
        c.Name=componentName
        c.kind=self.ComponentKind(componentName)
        c.Row=i
        c.Col=j
        c.orient="^"
        c.U=1.0
        
        if len(c.kind)==0:
            raise Exception(f"Unkown component type'{componentName}'.")
            
    def ComponentKind(self,componentName):
        
        if componentName.startswith(KIND_RZ):
            return KIND_RZ
        elif componentName.startswith(KIND_RK):
            return KIND_RK
        elif componentName.startswith(KIND_RR):
            return KIND_RR
        elif componentName.startswith(KIND_RL):
            return KIND_RL
        elif componentName.startswith(KIND_UCP):
            return KIND_UCP
        elif componentName.startswith(KIND_UPR):
            return KIND_UPR
        elif componentName.startswith(KIND_UCV):
            return KIND_UCV
        elif componentName.startswith(KIND_R):
            return KIND_R
        elif componentName.startswith(KIND_P):
            return KIND_P
        elif componentName.startswith(KIND_U):
            return KIND_U
        else:
            return ""
        
    def DispatchComponentParser(self,c,t):
        
        if c.kind == KIND_RZ:
            self.ParseRz(c,t)
        elif c.kind == KIND_RK:
            self.ParseRk(c,t)
        elif c.kind == KIND_RR:
            self.ParseRr(c,t)
        elif c.kind == KIND_RL:
            self.ParseRl(c,t)
        elif c.kind == KIND_R:
            self.ParsePipe(c,t)
        elif c.kind == KIND_P:
            self.ParsePump(c,t)
        elif c.kind == KIND_UCP:
            self.ParseUcp(c,t)
        elif c.kind == KIND_UPR:
            self.ParseUpr(c,t)
        elif c.kind == KIND_UCV:
            self.ParseUcv(c,t)
        elif c.kind == KIND_U:
            self.ParseUniversal(c,t)
            
    def ParseRz(self,c,t):
        
        c.Zeta = float(t[1])
        c.Diam = float(t[2])/MM_PER_M
        
        self.ReadOrient(c,t,3)
        
    def ParseRk(self,c,t):
        c.Kv = float(t[1])
        self.ReadOrient(c,t,2)
        
    def ParseRr(self,c,t):
        
        c.Diam = float(t[1]) / MM_PER_M
        self.ReadOrient(c, t, 2)
        c.Zeta = 1.0
        
    def ParseRl(self, c, t):
        
        c.Rd = float(t[1]) * PA_PER_BAR * S_PER_H
        c.Diam = float(t[2]) / MM_PER_M
        self.ReadOrient(c, t, 3)
        
    def ParsePipe(self, c, t):
        
        c.PipeLen = float(t[1])
        c.Diam = float(t[2]) / MM_PER_M
        self.ReadOrient(c, t, 3)
        
    def ParsePump(self, c, t):
        
        c.Qsc = float(t[1]) / S_PER_H
        c.Diam = float(t[2]) / MM_PER_M
        self.ReadOrient(c, t, 3)
        
    def ParseUcp(self, c, t):
        
        c.Qsc = float(t[1]) / S_PER_H
        c.DPoc = float(t[2]) * PA_PER_BAR
        c.Diam = float(t[3]) / MM_PER_M
        self.ReadOrient(c, t, 4)
        c.Rd = -c.DPoc / c.Qsc
        
    def ParseUpr(self, c, t):
        
        c.DPoc = float(t[1]) * PA_PER_BAR
        c.Rd = float(t[2]) * PA_PER_BAR * S_PER_H
        c.Diam = float(t[3]) / MM_PER_M
        self.ReadOrient(c, t, 4)
        c.Qsc = -c.DPoc / c.Rd
        
    def ParseUcv(self, c, t):
        
        c.DPoc = float(t[1]) * PA_PER_BAR
        c.Rd = float(t[2]) * PA_PER_BAR * S_PER_H
        c.Diam = float(t[3]) / MM_PER_M
        self.ReadOrient(c, t, 4)
        c.Qsc = -c.DPoc / c.Rd
        
    def ParseUniversal(self, c, t):
        
        c.DPoc = float(t[1]) * PA_PER_BAR
        c.Qsc = float(t[2]) / S_PER_H
        c.Diam = float(t[3]) / MM_PER_M
        self.ReadOrient(c, t, 4)
        c.Rd = -c.DPoc / c.Qsc
        
    def InitialiseComponentGeometry(self,c):
        
        if c.kind == KIND_RK:
            c.Area=c.Kv/(2**0.5)*(1.0/S_PER_H)*(self.Rho/PA_PER_BAR)**0.5
            c.Kd = 0.0
        else:
            c.Area = self.Pi/4.0*c.Diam**2
            c.Kd = (self.Krough/MM_PER_M)/c.Diam if c.Diam !=0 else 0.0
            
    def ReadOrient(self, c, t, idx):
         if len(t) > idx:  # idx ist 0-basiert! Kein -1!
            c.orient = t[idx]
    
    def FindConnectedNodes(self,c):
        
        slot = [0]
        foundNr = [False]
        startDir = self.StartDirection(c.orient)

        for offset in range(0, 4):
            scanDir = startDir + offset
            if scanDir > 4:
                scanDir = scanDir - 4

            ii = c.Row + self.RowStep(scanDir)
            jj = c.Col + self.ColStep(scanDir)

            if self.InGrid(ii, jj):
                if self.Schematic[ii - 1][jj - 1] != "":
                    self.WalkConnectionUntilNode(c, scanDir, ii, jj, slot, foundNr)

        self.EnsureTwoConnectedNodes(c, slot[0])
    
    def WalkConnectionUntilNode(self, c, scanDir, iiStart, jjStart, slot, foundNr):
         ii = iiStart
         jj = jjStart
         
         while True:
            cell_content = self.Schematic[ii - 1][jj - 1]
            head = cell_content[0] if cell_content else ""
            
            if self.IsNodeToken(head):
                self.RegisterFoundNode(c, scanDir, ii, jj, slot, foundNr)
                break
            elif self.IsWire(head):
                self.StepAlongConnection(scanDir, ii, jj)
                if not self.InGrid(ii, jj):
                    break
            else:
                self.RaiseSchematicTopologyError(c, ii, jj)
                break

       
    def IsNodeToken(self,head):
        
        return(head == "N" or head== "S")
    
    def RegisterFoundNode(self,c,scanDir,ii,jj,slot, foundNr):
        
        slot[0] += 1
        if slot[0] > 2:
            return

        if slot[0] == 1:
            c.orient = self.OrientFromScan(scanDir)

        cell_content = self.Schematic[ii - 1][jj - 1]
        parts = cell_content.split(" ")
        self.AssignNode(c, slot[0], parts, ii, jj, foundNr)
        
    def StepAlongConnection(self,scanDir,ii,jj):
        
        if self.RowStep(scanDir)!=0:
            ii[0]=ii[0]+self.RowStep(scanDir)
        else:
            jj[0]=jj[0]+self.ColStep(scanDir)
            
    def RaiseSchematicTopologyError(self,c,ii,jj):
        
        raise Exception (f"Error in Schematic for component '{c.Name}':\n"
                         f"Connected element '{self.Schematic[ii-1][jj-1]}'"
                         f"found instead of a node 'Nxx' (directl or via a connection'I').")
        
    def EnsureTwoConnectedNodes(self,c,slot):
        
        if slot<2:
           raise Exception(f"Component '{c.Name}' is not connected to two nodes.")
          
    def AssignNode(self,c,slot,t,ii,jj,foundNr):
        
        nm=t[0]
        hasZ=len(t)>=2
        isGround=(nm=="S")
        isNr=nm.startswith("Nr")
        
        z=0.0 
        nrP=0.0 
        idx=0
        
        if isGround:
            idx=GROUND
            if hasZ:
                z=float(t[1])
        elif isNr:
            idx= int(nm[2:])
            if hasZ:
                nrP= float(t[1])*PA_PER_BAR
            
            if foundNr[0]:
                raise Exception("only a single total pressure node 'Nrxx' may be connected to a pressure regulating component.")
            foundNr[0]=True
        else:
            idx=int(nm[2:])
            if hasZ:
                z=float(t[1])
                
        if idx>self.Max_Idx:
            self.Max_Idx=idx
        
        if slot==1:
            c.Nam1=nm 
            c.n1=idx 
            c.Z1=z
            c.NrP1=nrP
            c.Ri1=ii
            c.Cj1=jj
            
        else:
            c.Nam2=nm
            c.n2=idx
            c.Z2=z
            c.NrP2=nrP
            c.Ri2=ii
            c.Cj2=jj
    
    def DetermineNodeCount(self):
        
        self.Nnode=self.CountDefinedInternalNodes()
        self.EnsureNodeCountIsValid()
    
    def CountDefinedInternalNodes(self):
        
        count=0 
        for nodeIdx in range(0, self.Max_Idx+1):
            if self.ComponentUsesNodeIndex(nodeIdx):
                if nodeIdx>GROUND:
                    count += 1 
        return count 
    
    def ComponentUsesNodeIndex (self,nodeIdx):
        
        for c in self.Comp:
            if c.n1== nodeIdx or c.n2==nodeIdx:
                return True
        return False
    
    def EnsureNodeCountIsValid(self):
        
        if self.Nnode<1:
            raise Exception("No internal node found. The Schematic needs at least one node other than 'S'.")
        if self.Max_Idx>self.Nnode:
            raise Exception (f"Highest node index N{self.Max_Idx:02d} exceeds the node count"
                             f"{self.Nnode}. Node numbers must be consecutive: N01, N02,..., N{self.Nnode:02d}.")
            
    def CheckNodeElevations(self):
        
        for nodeIdx in range(1, self.Nnode+1):
            self.CheckElevationConsistencyForNode(nodeIdx)
    
    def CheckElevationConsistencyForNode(self, nodeIdx):
        state = [0.0, False] 
        for c in self.Comp:
            if c.n1 == nodeIdx:
                self.CheckOneElevation(c.Z1, state, nodeIdx)
            if c.n2 == nodeIdx:
                self.CheckOneElevation(c.Z2, state, nodeIdx)

    def CheckOneElevation(self, z, state, i):
        if state[1]:
            if z != state[0]:
                raise Exception(f"Inconsistent elevations for node N{i:02d}.")
        else:
            state[0] = z
            state[1] = True
    
    def StartDirection(self, orient):
        
        if orient == "^":
            return 1
        elif orient == "<":
            return 2
        elif orient == "v":
            return 3
        else:  
            return 4

    def RowStep(self, scanDir):
        
        if scanDir == 1:
            return -1
        elif scanDir == 3:
            return 1
        else:
            return 0
        
    def ColStep(self, scanDir):
        
        if scanDir == 2:
            return -1
        elif scanDir == 4:
            return 1
        else:
            return 0

    def OrientFromScan(self, scanDir):
        
        if scanDir == 1:
            return "^"
        elif scanDir == 2:
            return "<"
        elif scanDir == 3:
            return "v"
        else:
            return ">"

    def InGrid(self, ii, jj):
        
        return (1 <= ii <= self.Nrow and 1 <= jj <= self.Ncol)
    
    def IsWire(self, head):
        
        return head in ["I", "W", "F", "T", "V"]
            
    def RunSolver(self):
        
        self.X = [0.0] * (self.Nnode + 1)
        self.BuildNodeDirectory()
        self.Iiter = 0
        self.DUres = 1.0
        
        while True:
            self.Iiter += 1
            self.AssembleSystem()

            Xbar = self.LoesungsVektor(self.A, self.B)
            if Xbar is None:
                raise Exception("Coefficient matrix A is singular. Check the Schematic for a node number "
                                "assigned to two nodes - node numbers must be unique and ascending.")

            for inode in range(1, self.Nnode + 1):
                self.X[inode] = Xbar[inode] * PA_PER_BAR

            dUsum = self.UpdateFlows()
            self.DUres_m1 = self.DUres
            self.DUres = dUsum / self.Ncomp if self.Ncomp > 0 else 0.0

            if self.DUres <= self.DUcrit or self.Iiter >= self.NiterMax:
                break    
                    
    def BuildNodeDirectory(self):
        
        self.NodeName = [""] * (self.Nnode + 1)
        self.NodeZ = [0.0] * (self.Nnode + 1)
        
        for c in self.Comp:
            if c.n1 > GROUND:
                self.NodeName[c.n1] = c.Nam1
                self.NodeZ[c.n1] = c.Z1
            if c.n2 > GROUND:
                self.NodeName[c.n2] = c.Nam2
                self.NodeZ[c.n2] = c.Z2
                   
                    
    def AssembleSystem(self):
        
        n = self.Nnode
        self.A = [[0.0] * (n + 1) for _ in range(n + 1)]
        self.B = [0.0] * (n + 1)

        for c in self.Comp:
            
            c.Fwd = True
            if self.IsResistive(c.kind):
                self.ComponentResistance(c)
            self.StampComponent(c)

    def StampComponent(self, c):
        
        if not c.Fwd:
            return
        if self.IsResistive(c.kind):
            self.StampConductance(c)
        if self.IsSource(c.kind):
            self.StampSource(c)
            
    def IsResistive(self, kind):
        
        return kind.startswith(KIND_R) or kind.startswith(KIND_U)

    def IsSource(self, kind):
        
        return kind == KIND_P or kind.startswith(KIND_U)

    def StampConductance(self, c):
        
        g = self.Conductance(c)
        self.StampDiagonal(c.n1, g)
        self.StampDiagonal(c.n2, g)
        self.StampMutualConductance(c.n1, c.n2, g)
        self.StampGroundBoundary(c, g)

    def Conductance(self, c):
        
        return 1.0 / (c.Rd / PA_PER_BAR / S_PER_H)

    def StampDiagonal(self, node, g):
        
        if node > GROUND:
            self.A[node][node] += g
            
    def StampMutualConductance(self, n1, n2, g):
        
        if n1 > GROUND and n2 > GROUND:
            self.A[n1][n2] -= g
            self.A[n2][n1] -= g

    def StampGroundBoundary(self, c, g):
        
        if c.n1 > GROUND and c.n2 == GROUND:
            z = self.TapElevation(c, 2)
            self.B[c.n1] += self.BoundaryFlux(c, z, c.q < 0)
        if c.n2 > GROUND and c.n1 == GROUND:
            z = self.TapElevation(c, 1)
            self.B[c.n2] += self.BoundaryFlux(c, z, c.q > 0)
            
    def LoesungsVektor(self, A, b):
        
        try:
            n = self.Nnode
            A_mat = np.array([[A[i][j] for j in range(1, n + 1)] for i in range(1, n + 1)])
            b_vec = np.array([b[i] for i in range(1, n + 1)])
            x = np.linalg.solve(A_mat, b_vec)
            return [0.0] + list(x)
        except np.linalg.LinAlgError:
            return None

    def TapElevation(self, c, groundSide):
        
        if groundSide == 2:
            return c.Z2 if c.Z2 > 0 else c.Z1
        else:
            return c.Z1 if c.Z1 > 0 else c.Z2

    def BoundaryFlux(self, c, z, inflow):
        
        if inflow or c.kind == KIND_RK:
            head = self.Rho * self.G * z
        else:
            head = self.Rho * self.G * z + 0.5 * self.Rho * c.U ** 2
        return head / (c.Rd / PA_PER_BAR / S_PER_H) / PA_PER_BAR

    def StampSource(self, c):
        
        if c.n1 > GROUND:
            self.B[c.n1] -= c.Qsc * S_PER_H
        if c.n2 > GROUND:
            self.B[c.n2] += c.Qsc * S_PER_H

    def UpdateFlows(self):
        
        dUsum = 0.0
        for c in self.Comp:
            self.ComputeComponentFlow(c)
            self.EnforceClosedUniversalFlow(c)
            dUsum += self.RelaxComponentVelocity(c)
            self.UpdateComponentTotalPressures(c)
        return dUsum

    def ComputeComponentFlow(self, c):
        
        if c.kind == KIND_P:
            c.q = c.Qsc
        elif c.n2 == GROUND:
            self.ComputeFlowToGroundSide2(c)
        elif c.n1 == GROUND:
            self.ComputeFlowToGroundSide1(c)
        else:
            c.q = c.Qsc + (self.X[c.n1] - self.X[c.n2]) / c.Rd

    def ComputeFlowToGroundSide2(self, c):
        
        z = self.TapElevation(c, 2)
        numerator = c.Rd * c.Qsc + self.X[c.n1] - self.Rho * self.G * z
        if c.q < 0 or c.kind == KIND_RK:
            c.q = numerator / c.Rd
        else:
            c.q = numerator / (0.5 * self.Rho * c.U / c.Area + c.Rd)

    def ComputeFlowToGroundSide1(self, c):
        
        z = self.TapElevation(c, 1)
        numerator = c.Rd * c.Qsc + self.Rho * self.G * z - self.X[c.n2]
        if c.q > 0 or c.kind == KIND_RK:
            c.q = numerator / c.Rd
        else:
            c.q = numerator / (0.5 * self.Rho * c.U / c.Area + c.Rd)

    def EnforceClosedUniversalFlow(self, c):
        
        if c.kind.startswith(KIND_U) and not c.Fwd:
            c.q = 0.0

    def RelaxComponentVelocity(self, c):
        
        previousU = c.U
        c.U = abs(c.q / c.Area) if c.Area != 0 else 0.0
        c.U = abs(self.LambdaU * c.U + (1.0 - self.LambdaU) * previousU)
        return abs(c.U - previousU)

    def UpdateComponentTotalPressures(self, c):
        
        if c.n2 == GROUND:
            self.UpdatePressuresForGroundSide2(c)
        elif c.n1 == GROUND:
            self.UpdatePressuresForGroundSide1(c)
        else:
            c.Ptot1 = self.X[c.n1]
            c.Ptot2 = self.X[c.n2]

    def UpdatePressuresForGroundSide2(self, c):
        
        z = self.TapElevation(c, 2)
        if c.q < 0 or c.kind == KIND_RK:
            c.Ptot2 = self.Rho * self.G * z
        else:
            c.Ptot2 = self.Rho * self.G * z + 0.5 * self.Rho * c.U ** 2
        c.Ptot1 = self.X[c.n1]

    def UpdatePressuresForGroundSide1(self, c):
        
        z = self.TapElevation(c, 1)
        if c.q > 0 or c.kind == KIND_RK:
            c.Ptot1 = self.Rho * self.G * z
        else:
            c.Ptot1 = self.Rho * self.G * z + 0.5 * self.Rho * c.U ** 2
        c.Ptot2 = self.X[c.n2]
        
    def ComponentResistance(self, c):
        
        if c.kind == KIND_UCV:
            self.UpdateCheckValveState(c)
        elif c.kind == KIND_RR:
            self.ComputePressureRegulatorResistance(c)
        elif c.kind == KIND_RZ:
            self.ComputeZetaResistance(c)
        elif c.kind == KIND_RK:
            self.ComputeKvResistance(c)
        elif c.kind == KIND_R:
            self.ComputePipeResistance(c)
        elif c.kind in [KIND_UCP, KIND_UPR, KIND_U, KIND_RL]:
            pass  
        else:
            raise Exception(f"No resistance model for component '{c.Name}'.")

    def ComputeZetaResistance(self, c):
        
        c.Rd = self.Rho / 2.0 * c.U / c.Area * c.Zeta

    def ComputeKvResistance(self, c):
        
        c.Rd = c.U * PA_PER_BAR * (S_PER_H ** 2) * c.Area / (c.Kv ** 2)

    def UpdateCheckValveState(self, c):
        
        if self.Iiter > 1:
            if (c.Ptot1 - c.Ptot2) <= c.Dpoc:
                c.Fwd = False

    def ComputePressureRegulatorResistance(self, c):
        
        if self.Iiter == 1:
            c.Rd = self.Rho / 2.0 * c.U / c.Area * c.Zeta
        else:
            self.UpdatePressureRegulatorResistance(c)

    def UpdatePressureRegulatorResistance(self, c):
        
        if c.Nam1.startswith("Nr"):
            c.Rd = c.Rd * (c.NrP1 - c.Ptot2) / (c.Ptot1 - c.Ptot2)
        else:
            c.Rd = c.Rd * (c.NrP2 - c.Ptot1) / (c.Ptot2 - c.Ptot1)
            
    def ComputePipeResistance(self, c):
        
        Rlam = self.LaminarPipeResistance(c)
        Re = self.ReynoldsNumber(c)
        Rturb = self.TurbulentPipeResistance(c, Re)
        c.Rd = self.BlendPipeResistance(Re, Rlam, Rturb)

    def LaminarPipeResistance(self, c):
        
        return (128.0 / self.Pi) * c.PipeLen / (c.Diam ** 4) * self.Mue

    def ReynoldsNumber(self, c):
        return c.U * c.Diam * self.Rho / self.Mue

    def TurbulentPipeResistance(self, c, Re):
        
        lam = self.PipeFrictionCoefficient(c, Re)
        return self.Rho / 2.0 * c.U / c.Area * lam * c.PipeLen / c.Diam

    def PipeFrictionCoefficient(self, c, Re):
        
        if c.U <= 0:
            return 0.0
        elif self.Zanke:
            return self.ZankeFrictionCoefficient(c, Re)
        else:
            return self.MillerFrictionCoefficient(c, Re)

    def ZankeFrictionCoefficient(self, c, Re):
        
        import math
        ReForLog = Re if Re > 1.0 else 1.0
        return (-2.0 * math.log10(2.7 * (math.log10(ReForLog) ** 1.2) / Re + c.Kd / 3.71)) ** -2

    def MillerFrictionCoefficient(self, c, Re):
        
        import math
        return 0.25 / (math.log10(c.Kd / 3.7 + 5.74 / (Re ** 0.9))) ** 2

    def BlendPipeResistance(self, Re, Rlam, Rturb):
        
        ReLo = self.Recrit * (1.0 - self.KRelt)
        ReHi = self.Recrit * (1.0 + self.KRelt)

        if Re > ReLo and Re < ReHi:
            wf = (Re - ReLo) / (ReHi - ReLo)
            import math
            wfsin = 0.5 * (math.sin((wf - 0.5) * self.Pi) + 1.0)
            return (1.0 - wfsin) * Rlam + wfsin * Rturb
        elif Re >= ReHi:
            return Rturb
        else:
            return Rlam
    
    def WriteResults(self):
        
        self.AllocateResultArrays()
        self.FillResultArrays()
        
       
    def AllocateResultArrays(self):
       
        self.OutRnam = [""] * self.Ncomp
        self.OutNn1 = [""] * self.Ncomp
        self.OutNn2 = [""] * self.Ncomp
        self.OutDiri = [""] * self.Ncomp
        self.OutNnam = [""] * self.Nnode
        self.OutRval = [0.0] * self.Ncomp
        self.OutRd = [0.0] * self.Ncomp
        self.OutDPoc = [0.0] * self.Ncomp
        self.OutQsc = [0.0] * self.Ncomp
        self.OutLval = [0.0] * self.Ncomp
        self.OutDval = [0.0] * self.Ncomp
        self.OutQ = [0.0] * self.Ncomp
        self.OutAbsQ = [0.0] * self.Ncomp
        self.OutU = [0.0] * self.Ncomp
        self.OutReD = [0.0] * self.Ncomp
        self.OutQdyn = [0.0] * self.Ncomp
        self.OutDP = [0.0] * self.Ncomp
        self.OutPow = [0.0] * self.Ncomp
        self.OutKv = [0.0] * self.Ncomp
        self.OutX = [0.0] * self.Nnode
        self.OutPtmP = [0.0] * self.Nnode
        self.OutZ = [0.0] * self.Nnode
        self.OutNum1 = [0] * self.Ncomp
        self.OutNum2 = [0] * self.Ncomp
        self.OutIi1 = []
        self.OutJj1 = []
        self.OutIi2 = []
        self.OutJj2 = []
        self.OutI0 = []
        self.OutJ0 = []

    def FillResultArrays(self):
        
        for ic in range(self.Ncomp):
            c = self.Comp[ic]
            self.OutRnam[ic] = c.Name
            self.OutNn1[ic] = c.Nam1
            self.OutNn2[ic] = c.Nam2
            self.OutRd[ic] = c.Rd / PA_PER_BAR / S_PER_H
            self.OutDPoc[ic] = c.Dpoc / PA_PER_BAR
            self.OutQsc[ic] = c.Qsc * S_PER_H
            self.OutLval[ic] = c.PipeLen
            self.OutDval[ic] = c.Diam
            self.OutQ[ic] = c.q * S_PER_H
            self.OutAbsQ[ic] = abs(self.OutQ[ic])
            self.OutU[ic] = c.U
            self.OutKv[ic] = c.Kv

            if c.kind != KIND_RK:
                self.OutReD[ic] = c.U * c.Diam * self.Rho / self.Mue
                self.OutQdyn[ic] = 0.5 * self.Rho * c.U ** 2 / PA_PER_BAR
            else:
                self.OutReD[ic] = 0.0
                self.OutQdyn[ic] = 0.0

            dP = c.Ptot1 - c.Ptot2
            self.OutDP[ic] = dP / PA_PER_BAR
            self.OutPow[ic] = dP * c.q / 1000.0
            self.OutDiri[ic] = c.orient
            self.OutNum1[ic] = c.n1
            self.OutNum2[ic] = c.n2

        for inode in range(self.Nnode):
            
            nodeIdx = inode + 1
            self.OutNnam[inode] = self.NodeName[nodeIdx]
            self.OutX[inode] = self.X[nodeIdx] / PA_PER_BAR
            self.OutZ[inode] = self.NodeZ[nodeIdx]
            self.OutPtmP[inode] = self.OutX[inode] - self.Rho * self.G * self.NodeZ[nodeIdx] / PA_PER_BAR

  

             


    