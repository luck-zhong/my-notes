# 高速光模块架构：LRO / LPO / NPO / XPO

## Linear

在 LRO / LPO 语境里，**Linear 指的是高速模拟信号尽量不经过数字重定时 DSP，而是以模拟波形的形式在线性链路中传输。**

你可以把它和传统 DSP 模块对比：

```
传统 DSP 模块：

Host SerDes
   ↓
模拟电信号
   ↓
Module DSP
   ↓  ADC / DSP / CDR / Retiming
重新生成数字信号
   ↓
DAC / Driver
   ↓
Optical Signal
```

而 Linear 架构更像：

```
Host SerDes
   ↓
高速模拟波形
   ↓
Linear Driver / Amplifier
   ↓
Modulator
```

RX 也是类似：

```
PD
 ↓
TIA
 ↓
高速模拟波形
 ↓
Host SerDes
```

核心差别就是：

> **Linear 链路中不在模块内部把信号“判决成 0/1 后重新生成”，而是尽量保持原始高速波形，仅进行放大、增益、均衡等模拟处理。**

这也是为什么 LPO 对信号完整性要求很高。

比如 PAM4 本质上是 4 个电平：

```
Level 3   ─────
Level 2   ─────
Level 1   ─────
Level 0   ─────
```

经过 PCB、Connector、Driver、TIA 后，这些电平可能发生：

```
衰减
噪声
ISI
幅度失真
抖动
```

传统 DSP 模块可以：

```
接收失真的波形
      ↓
CTLE / FFE / DFE
      ↓
CDR
      ↓
Decision
      ↓
重新生成干净 PAM4
```

但 Linear 模块通常没有这一步完整的数字重生能力，而是：

```
失真的 PAM4 waveform
       ↓
模拟放大 / EQ
       ↓
继续往后传
```

所以你可以把 **Linear** 简单记成：

> **“波形透传 + 模拟处理”，而不是“数字判决 + Retiming + 重新生成”。**

再对应到名称：

```
LRO
Linear Receive Optics

→ Receive 方向是 Linear
→ RX 没有完整 DSP Retiming


LPO
Linear Pluggable Optics

→ TX / RX 都尽量采用 Linear architecture
→ 模块内部高速 DSP/CDR 大幅减少甚至取消
```

这里还有一个很关键的概念：

**Linear ≠ 什么处理都不做。**

Linear Driver、TIA 仍然可能做：

```
Gain
VGA
CTLE
Bandwidth Control
Peaking
Amplitude Control
Bias Control
```

只是这些通常属于**模拟域处理**，不会像 DSP 那样：

```
采样
→ 数字均衡
→ CDR
→ Symbol Decision
→ Retiming
→ 重新生成
```

## 1. 总体认知框架

LRO、LPO、NPO、XPO 并不是完全处于同一个分类维度。

可以先这样理解：

```text
传统可插拔光模块
    │
    ├── 降低模块内部 DSP 功耗
    │      ├── LRO：RX 线性，TX 保留 Retimer/DSP
    │      └── LPO：TX/RX 都采用线性链路，基本去掉模块 DSP/CDR
    │
    └── 解决超高速电通道过长问题
           ├── NPO：光引擎搬到交换 ASIC 附近
           └── XPO：继续保留 Pluggable，但提高带宽密度
```

需要重点区分：

- **LRO / LPO**：主要描述高速电信号如何处理，即 DSP / Retimer 是否保留。
- **NPO**：主要描述光引擎距离交换 ASIC 的物理位置。
- **XPO**：主要描述超高密度可插拔光学形态，重点是高带宽密度和可维护性。

---

## 2. 传统 DSP 光模块

传统高速光模块一般可以抽象为：

```text
Switch ASIC
    │
    │ Host Electrical Signal
    ▼
┌─────────────────────────┐
│ Optical Module          │
│                         │
│  DSP                    │
│   ├── HRx EQ / CDR      │
│   └── HTx EQ / CDR      │
│         │               │
│  Driver / TIA           │
│         │               │
│       PIC               │
└─────────────────────────┘
```

模块内部 DSP 的主要作用包括：

- 均衡
- CDR
- Retiming
- FFE / DFE / CTLE
- Lane Mapping
- PRBS
- BER 相关诊断
- Host / Media 两侧信号恢复

传统 DSP 模块最大的优点之一是：

```text
Host SI 较差
    ↓
Module DSP
    ↓
重新均衡 / 恢复时钟 / Retiming
    ↓
后级获得相对规整的信号
```

代价则是：

```text
DSP
 ↓
功耗增加
发热增加
成本增加
延迟增加
```

---

## 3. LPO：Linear Pluggable Optics

### 3.1 定义

LPO：

> **Linear Pluggable Optics**

核心思想：

> 去掉或大幅减少光模块中的高速 DSP / CDR，让交换机 ASIC SerDes 更直接地驱动 Driver，并直接接收 TIA 输出。

---

### 3.2 传统模块与 LPO 的区别

传统模块 TX：

```text
Switch ASIC
    ↓
PCB
    ↓
Module DSP
    ↓
Driver
    ↓
Modulator
```

传统模块 RX：

```text
PD
 ↓
TIA
 ↓
Module DSP
 ↓
PCB
 ↓
Switch ASIC
```

LPO TX：

```text
Switch ASIC SerDes
        ↓
       PCB
        ↓
      Driver
        ↓
    Modulator
```

LPO RX：

```text
PD
 ↓
TIA
 ↓
PCB
 ↓
Switch ASIC SerDes
```

因此 LPO 中：

```text
Module DSP  → 基本取消
Module CDR  → 基本取消
```

---

### 3.3 LPO 的核心变化

传统 DSP 模块：

```text
Host SI 有一定问题
    ↓
Module DSP 可能补偿
```

LPO：

```text
Host SI 较差
    ↓
直接进入 Driver / Optical Link
    ↓
BER / Eye / Margin 恶化
```

因此 LPO 对以下环节的要求更高：

- Switch ASIC SerDes
- PCB Trace
- Connector
- Module Host Interface
- Driver
- TIA
- PIC
- 整条 Link SI Budget

LPO 的本质不是简单的“把 DSP 去掉”，而是：

> **把原来模块 DSP 承担的一部分信号恢复责任，重新分配给 Host SerDes、Driver、TIA 和系统 SI 设计。**

---

### 3.4 对固件开发的影响

传统 DSP 模块固件经常需要管理：

```text
CTLE
DFE
FFE
CDR Lock
Lane Mapping
PRBS
BER
DSP Adaptation
DSP Firmware / API
DSP Polarity
```

LPO 模块中，这些 DSP 相关控制会明显减少。

MCU 工作重点可能更多转向：

```text
Driver Control
TIA Control
PIC Bias Control
TEC
Monitor
CMIS
SI Parameter Coordination
Fault Management
Calibration
```

因此：

> LPO 并不意味着固件调试更简单。

DSP 少了，但 Host、PCB、Driver、TIA、PIC 之间的系统耦合会增强。

---

## 4. LRO：Linear Receive Optics

### 4.1 定义

LRO：

> **Linear Receive Optics**

它可以理解为传统 DSP 模块与 LPO 之间的一种折中方案。

典型思路：

```text
TX：保留 DSP / Retimer
RX：取消 DSP，采用 Linear RX
```

---

### 4.2 信号路径

LRO TX：

```text
Switch ASIC
    ↓
Module TX DSP / CDR
    ↓
Driver
    ↓
Modulator
```

LRO RX：

```text
PD
 ↓
TIA
 ↓
直接进入 Host SerDes
```

因此可以记成：

| 架构 | TX DSP | RX DSP |
|---|---:|---:|
| 传统 DSP Module | 有 | 有 |
| LRO | 有 | 无 |
| LPO | 无 | 无 |

---

### 4.3 为什么 TX 保留 DSP

TX 保留 DSP / Retimer 后，可以继续对发射信号进行整形、均衡和 Retiming。

这样做的意义是：

```text
Host Electrical Signal
        ↓
TX DSP / Retimer
        ↓
Driver
        ↓
Optical TX Waveform
```

模块仍可以对最终光发射波形提供更强控制。

因此 LRO 的定位通常是：

```text
功耗：
传统 DSP > LRO > LPO

系统隔离能力：
传统 DSP > LRO > LPO

实现风险：
LPO 通常高于 LRO
```

LRO 可以看成：

> **用部分 Retiming 能力换取更好的互操作性，同时比传统双向 DSP 模块降低功耗。**

---

## 5. NPO：Near-Package Optics

### 5.1 定义

NPO：

> **Near-Package Optics**

它和 LPO/LRO 不是同一个维度。

NPO 主要解决的问题是：

> 高速 SerDes 信号在 PCB 上传输距离过长。

传统前面板可插拔模块：

```text
              长 PCB Trace
Switch ASIC ========================== OSFP
                                        │
                                       DSP
                                        │
                                       PIC
```

随着单 Lane 速率上升，例如：

```text
112G/lane
224G/lane
```

PCB 高速电通道的问题越来越明显：

- Insertion Loss 增大
- Crosstalk 增大
- Equalization 难度增加
- SerDes Power 增大
- PCB 材料和走线要求提高
- Link Margin 降低

---

### 5.2 NPO 的解决方案

把光引擎搬到交换 ASIC 附近：

```text
        短电通道
Switch ASIC ───── Optical Engine
                       │
                       │ Fiber
                       ▼
                  Front Panel
```

Optical Engine 内部通常可能包含：

```text
PIC
Driver
TIA
部分控制电路
```

因此核心变化是：

```text
传统 Pluggable：
ASIC ================= Module
       长高速 PCB

NPO：
ASIC ---- Optical Engine
       短高速 PCB
```

---

## 6. NPO 与 CPO

理解 NPO 时最好同时理解 CPO。

### NPO

```text
ASIC ---- Optical Engine
```

光引擎靠近 ASIC，但仍然是相对独立的器件或模块。

### CPO

```text
┌────────────────────────┐
│ ASIC + Optical Engine  │
└────────────────────────┘
```

光引擎与交换 ASIC 进入同一封装或高度集成的封装体系。

可以粗略理解为：

```text
高速电通道长度：

传统 Pluggable
       ↓
      最长

NPO
       ↓
      很短

CPO
       ↓
      最短
```

---

## 7. XPO：eXtra-dense Pluggable Optics

### 7.1 定义

当前产业中常见的 XPO 指：

> **eXtra-dense Pluggable Optics**

即：

> **超高密度可插拔光学。**

它主要想解决：

```text
CPO / NPO：
带宽密度高
但维护、替换复杂

传统 Pluggable：
维护方便
但密度和功耗压力越来越大
```

因此 XPO 的目标是：

```text
高带宽密度
+
Pluggable
+
Field Replaceable
+
更高功耗处理能力
+
高密度光纤接口
```

---

### 7.2 XPO 与 LPO/LRO 不冲突

非常重要：

```text
XPO ≠ LPO
XPO ≠ LRO
```

因为它们描述的是不同问题。

XPO 可以采用：

```text
XPO + Full Retimed

XPO + LRO

XPO + LPO
```

所以：

```text
XPO
↓
Form Factor / Density / Packaging

LPO / LRO
↓
Signal Processing Architecture
```

---

## 8. 不要把 XPO 简单理解成 External Laser

一些资料可能会把 XPO 与 External Laser 联系起来，但从概念分类上：

> **External Laser 并不是 XPO 的核心定义。**

External Laser 可以作为某些高密度光学方案的一部分。

外置激光还有另外的相关概念，例如：

```text
ELSFP
External Laser Small Form-Factor Pluggable
```

因此学习时建议区分：

```text
XPO
→ 高密度可插拔架构

External Laser
→ 激光源放置方式

LPO / LRO
→ 高速电信号处理方式

NPO / CPO
→ Optical Engine 与 ASIC 的位置关系
```

---

## 9. 四种架构放到同一个框架

```text
                         Switch ASIC
                             │
                    ┌────────┴────────┐
                    │                 │
              信号处理架构        位置 / 封装架构
                    │                 │
              ┌─────┴─────┐      ┌────┴─────┐
              │           │      │          │
             LRO         LPO    NPO        XPO
              │           │      │          │
        RX Linear     TX/RX     光引擎      超高密度
        TX Retimed    Linear    靠近 ASIC   Pluggable
```



---

## 10. 从光模块固件角度理解

### 传统 DSP Module

固件可能需要重点管理：

```text
DSP Init
DSP Firmware / API
CTLE
FFE
DFE
CDR
Lane Mapping
PRBS
BER
EQ Adaptation
CMIS SI Control
```

### LRO

固件仍然需要维护：

```text
TX DSP / Retimer
TX Equalization
TX CDR
Driver
TIA
PIC
CMIS
```

但 RX DSP 相关控制减少。

### LPO

DSP 控制大幅减少，重点转向：

```text
Driver
TIA
PIC
TEC
Calibration
Monitor
CMIS
Fault Management
Host / Module SI Coordination
```

### NPO / XPO

除高速电接口外，还需要关注：

```text
Thermal Management
Power Budget
High-Density Management
Optical Engine Initialization
Fault Isolation
Module / Engine Replaceability
Management Interface Architecture
```

