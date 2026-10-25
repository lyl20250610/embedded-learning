/* ==================== 嵌入式学习平台 · 课程数据 ==================== */
/* 课程内容使用受限 HTML 书写；代码块使用 <codeblock lang=... title=...> */
"use strict";

const COURSES = [
  {
    id: "c-basics",
    title: "C语言与嵌入式编程基础",
    icon: "🇨",
    gradient: "linear-gradient(135deg,#0ea5e9,#2563eb)",
    level: "入门",
    desc: "嵌入式开发的地基。从内存模型、指针到位运算与关键字陷阱，写出更贴近硬件的C代码。",
    tags: ["指针", "位运算", "内存布局", "volatile"],
    lessons: [
      {
        title: "为什么嵌入式开发从C开始",
        minutes: 8,
        content: `
<h2>贴近硬件的"中级语言"</h2>
<p>C语言被称为"可移植的汇编"：它既有高级语言的结构化表达能力，又能直接操作内存地址和硬件寄存器。绝大多数单片机SDK——ST的HAL库、乐鑫ESP-IDF、Nordic nRF SDK——的底层都是C写的。</p>
<p>在嵌入式场景下，C 的三个优势无法替代：</p>
<ul>
  <li><b>可预测的内存占用</b>：没有垃圾回收，每一字节的 RAM/Flash 都在掌控之中；</li>
  <li><b>直接访问硬件</b>：可以把任意地址强转为指针去读写寄存器；</li>
  <li><b>编译产物小、启动快</b>：Cortex-M 上电几微秒即可进入 main()。</li>
</ul>
<codeblock lang="c" title="hello_mcu.c — 一段最典型的寄存器操作">
#include &lt;stdint.h&gt;

/* 假设 0x40010800 是某GPIO输出数据寄存器地址 */
#define GPIOA_ODR  (*(volatile uint32_t *)0x40010800)

void led_toggle(void)
{
    GPIOA_ODR ^= (1u &lt;&lt; 5);   /* 翻转 PA5，第5位取反 */
}
</codeblock>
<div class="tip-box">💡 <b>学习路线建议：</b>先用C把语言基础打牢（指针、位运算、链接过程），再上开发板。语言层面欠的账，到了板子上都会变成"点不亮的LED"。</div>
<h3>本课程你将学会</h3>
<ul>
  <li>指针与内存模型——嵌入式C的灵魂；</li>
  <li>用位运算读写寄存器的指定位；</li>
  <li>volatile / const / static 在嵌入式中的真实含义；</li>
  <li>结构体对齐与 RAM 节省技巧。</li>
</ul>`,
      },
      {
        title: "内存模型与指针实战",
        minutes: 15,
        content: `
<h2>内存就像一条编号的街道</h2>
<p>程序中的每个变量都住在内存的某个"门牌号"（地址）里。指针就是保存门牌号的变量。嵌入式工程师必须对这张图了然于心：</p>
<codeblock lang="text" title="C程序内存布局（从低地址到高地址）">
+------------------+ 高地址
|       栈 Stack    | ← 局部变量、函数调用，向下增长
|        ↓          |
|                  |
|        ↑          |
|       堆 Heap     | ← malloc 分配（嵌入式慎用）
+------------------+
|   .bss 未初始化数据 | ← 未初始化的全局/static变量（上电清零）
|   .data 已初始化数据| ← 已初始化的全局变量（存Flash，启动时搬到RAM）
+------------------+
|   .rodata 常量     | ← const 常量、字符串字面量
|   .text 代码       | ← 机器指令
+------------------+ 低地址（Flash区）
</codeblock>
<h3>指针四则演算与类型</h3>
<p>指针的类型决定了"一步跨多远"：<code class="inline">uint8_t *</code> 加1前进1字节，<code class="inline">uint32_t *</code> 加1前进4字节。这就是为什么强转指针类型时必须小心对齐问题。</p>
<codeblock lang="c" title="pointer_demo.c">
#include &lt;stdio.h&gt;
#include &lt;stdint.h&gt;

uint8_t buf[8] = {0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88};

int main(void)
{
    uint8_t  *p8  = buf;                  /* 指向第0字节 */
    uint32_t *p32 = (uint32_t *)buf;      /* 强转后一次读4字节 */

    printf("p8[0]      = 0x%02X\\n", p8[0]);        /* 0x11 */
    printf("*p32       = 0x%08X\\n", *p32);         /* 小端: 0x44332211 */
    printf("*(p8 + 4)  = 0x%02X\\n", *(p8 + 4));    /* 0x55 */

    p8 += 2;                               /* 前进2字节 */
    printf("p8 after   = 0x%02X\\n", *p8);         /* 0x33 */
    return 0;
}
</codeblock>
<div class="tip-box warn">⚠️ <b>小端序（Little-Endian）：</b>Cortex-M、x86 都是低字节存低地址。上例中 <code class="inline">0x44332211</code> 的读法就是强转指针后最常见的"惊喜"。跨机通信时务必用移位拼包，而不是指针强转。</div>
<h3>指针与数组、函数</h3>
<ul>
  <li><code class="inline">buf[i]</code> 本质是 <code class="inline">*(buf + i)</code>，数组名退化为首元素指针；</li>
  <li><code class="inline">void (*fp)(int)</code> 是函数指针，驱动层的"回调"全靠它：注册一个中断处理函数，事件发生时被调用；</li>
  <li><code class="inline">const char *p</code> 指向的内容只读；<code class="inline">char * const p</code> 指针本身只读——口诀："读谁谁不能改"。</li>
</ul>`,
      },
      {
        title: "位运算与寄存器操作",
        minutes: 14,
        content: `
<h2>嵌入式工程师的第二母语</h2>
<p>芯片手册里，一个32位配置寄存器的每一位都有名字。外设配置的本质就是<b>精准地改某些位而不碰其他位</b>。这六个模板要练到肌肉记忆：</p>
<codeblock lang="c" title="bit_ops.c — 六大位操作模板">
#define BIT(n)  (1u &lt;&lt; (n))

uint32_t reg;

reg |=  BIT(3);            /* 置位第3位      */
reg &amp;= ~BIT(3);            /* 清零第3位      */
reg ^=  BIT(3);            /* 翻转第3位      */
if (reg &amp; BIT(3)) { }      /* 测试第3位      */

/* 修改一个位域：把第8~11位改成0xB（先清后置） */
reg &amp;= ~(0xFu &lt;&lt; 8);
reg |=  (0xBu &lt;&lt; 8);

/* 提取第8~11位 */
uint32_t val = (reg &gt;&gt; 8) &amp; 0xFu;
</codeblock>
<div class="tip-box">💡 <b>读-改-写：</b><code class="inline">|=</code> 和 <code class="inline">&amp;=</code> 看似一条语句，实际是"读寄存器→修改→写回"三步。如果这条寄存器同时会被中断服务程序修改，就必须考虑竞态（用临界区保护）。</div>
<h2>实战：解析一个传感器数据包</h2>
<codeblock lang="c" title="parse.c — 从4字节里拼出12位温度值">
/* 数据帧: [设备ID(4bit) | 温度(12bit)] 共2字节, 大端发送 */
int16_t parse_temperature(const uint8_t *frame, uint8_t *dev_id)
{
    *dev_id = (frame[0] &gt;&gt; 4) &amp; 0x0F;             /* 高4位 */
    uint16_t raw = ((uint16_t)(frame[0] &amp; 0x0F) &lt;&lt; 8)
                 |  frame[1];                      /* 低12位 */

    /* 12位无符号数，量程 0~4095 对应 -50.0 ~ +150.0 ℃ */
    return (int16_t)(raw);
}

float raw_to_celsius(uint16_t raw)
{
    return -50.0f + raw * 200.0f / 4095.0f;
}
</codeblock>
<h3>移位的两个坑</h3>
<ul>
  <li>对<b>有符号数</b>右移是"算术移位"（补符号位），可移植代码应改用除法或先转无符号；</li>
  <li><code class="inline">1 &lt;&lt; 31</code> 中 <code class="inline">1</code> 是 int，移到符号位是未定义行为——永远写 <code class="inline">1u &lt;&lt; 31</code>。</li>
</ul>`,
      },
      {
        title: "volatile、const 与关键字陷阱",
        minutes: 12,
        content: `
<h2>volatile：别自作聪明，编译器</h2>
<p>开启优化（-O2）后，编译器会假设"内存不会被看不见的人修改"。但嵌入式里有三个"看不见的人"：</p>
<ul>
  <li><b>中断服务程序（ISR）</b>——主循环看不到它改了标志位；</li>
  <li><b>硬件寄存器</b>——读一次可能就是一次真实动作（如清除标志）；</li>
  <li><b>其他线程/其他核</b>。</li>
</ul>
<codeblock lang="c" title="volatile_demo.c — 经典死循环bug">
/* 错误写法: 编译器优化后 while 空转, 永远看不到 flag 变化 */
uint32_t flag = 0;

int main(void)
{
    while (flag == 0) { }   /* -O2 下被优化成 while(1); */
}

void USART1_IRQHandler(void)   /* 中断里更新 flag */
{
    flag = 1;
}

/* 正确写法: 只需一行 */
volatile uint32_t flag = 0;
</codeblock>
<div class="tip-box warn">⚠️ <b>口诀：</b>"中断与主循环共享的变量、寄存器映射、多线程共享的变量，一律加 volatile"。但 volatile 只保证"每次都真读真写"，<b>不保证原子性</b>——32位MCU上读写16位以下变量才是原子的。</div>
<h2>const 与 Flash</h2>
<p>带初始化值的 <code class="inline">const</code> 全局数组会被链接进 <code class="inline">.rodata</code> 段，直接存在 Flash 里，<b>不占 RAM</b>。这暴露了两个实用技巧：</p>
<codeblock lang="c" title="const_table.c — 用Flash存查找表">
/* 256字节正弦表放Flash, 0 RAM占用 */
const uint8_t sine_table[256] = { 128, 131, 134, /* ... */ };

/* 字符串提示语同理 */
const char *msg_ok  = "motor started";
const char *msg_err = "sensor fault";
</codeblock>
<h3>其他高频关键字速查</h3>
<ul>
  <li><code class="inline">static</code> 局部：函数退出后值保留；全局/函数：仅本文件可见（模块化封装利器）；</li>
  <li><code class="inline">extern</code>：声明"这个符号在别的文件里"，头文件里到处都是；</li>
  <li><code class="inline">inline</code>：建议编译器内联，小函数省调用开销；</li>
  <li><code class="inline">__attribute__((packed))</code>：取消结构体填充，通信协议结构体必备（GCC语法）。</li>
</ul>`,
      },
      {
        title: "结构体对齐与内存优化",
        minutes: 11,
        content: `
<h2>sizeof 为什么比你算的大？</h2>
<p>CPU 访问对齐的地址最快，所以编译器会在结构体成员之间<b>塞填充字节</b>。这直接影响两件事：RAM占用、通信协议的字节布局。</p>
<codeblock lang="c" title="align.c">
#include &lt;stdio.h&gt;

struct SensorData {
    uint8_t  id;      /* 1字节 + 3填充 */
    uint32_t ts;      /* 4字节         */
    uint8_t  flag;    /* 1字节 + 3填充 */
};                    /* sizeof = 12 */

struct __attribute__((packed)) SensorDataPacked {
    uint8_t  id;
    uint32_t ts;
    uint8_t  flag;
};                    /* sizeof = 6 */

int main(void)
{
    printf("%zu %zu\\n", sizeof(struct SensorData),
                        sizeof(struct SensorDataPacked));  /* 12 6 */
    return 0;
}
</codeblock>
<h3>省RAM三板斧（不改结构体的前提下）</h3>
<p>把大成员放前面、小成员放后面，手动重排即可减少填充。上面例子调整顺序后：</p>
<codeblock lang="c" title="重排成员: 12字节 → 8字节">
struct SensorDataOpt {
    uint32_t ts;      /* 4字节 */
    uint8_t  id;      /* 1字节 */
    uint8_t  flag;    /* 1字节 + 2填充 */
};                    /* sizeof = 8, 不需要 packed */
</codeblock>
<div class="tip-box">💡 <b>什么时候用 packed：</b>与通信帧、Flash存储格式、DMA缓冲区对应的结构体<b>必须</b> packed（并配合 <code class="inline">static_assert(sizeof(...) == 期望值)</code> 检查）。纯内部数据结构优先靠排序省空间，packed 成员在某些架构上访问会更慢。</div>
<h2>位域：更极致的压缩</h2>
<codeblock lang="c" title="bitfield.c — 一个字节装下8个开关">
struct DeviceFlags {
    uint8_t power  : 1;
    uint8_t mode   : 3;   /* 0~7 档位 */
    uint8_t fault  : 1;
    uint8_t reserved : 3;
};
/* sizeof = 1, 直接对某个状态字节做映射 */
</codeblock>
<h3>本章小结</h3>
<ul>
  <li>结构体默认按成员最大对齐数对齐，中间有填充；</li>
  <li>成员按从大到小排序可减少体积；</li>
  <li>packed 用于协议/存储映射，位域用于标志位集合；</li>
  <li>RAM紧张时用 <code class="inline">arm-none-eabi-size</code> 查看 .data/.bss 占用，先优化大头。</li>
</ul>`,
      },
    ],
  },

  {
    id: "mcu51",
    title: "51单片机从零入门",
    icon: "🔌",
    gradient: "linear-gradient(135deg,#10b981,#0d9488)",
    level: "入门",
    desc: "最经典的学习起点。认识最小系统，点亮LED，玩转定时器、中断与串口，建立'芯片在跑什么'的直觉。",
    tags: ["GPIO", "定时器", "中断", "UART"],
    lessons: [
      {
        title: "认识单片机与最小系统",
        minutes: 10,
        content: `
<h2>一片芯片就是一台电脑</h2>
<p>单片机（MCU）= CPU + RAM + Flash + 外设（定时器/串口/GPIO…），全部集成在一块芯片上。以经典的 STC89C52 / AT89C51 为例：</p>
<ul>
  <li><b>8位8051内核</b>，典型主频 11.0592MHz 或 12MHz；</li>
  <li>4KB~8KB 程序Flash、512B 内部RAM——"小"正是学习价值：逼你理解每个字节去哪了；</li>
  <li>4个8位并行口 P0~P3，共32个GPIO。</li>
</ul>
<h2>最小系统五大件</h2>
<p>让一块51芯片跑起来，电路图上必须画全：</p>
<codeblock lang="text" title="51最小系统清单">
1. 电源    VCC(5V) / GND —— 一切的前提
2. 时钟    XTAL1/XTAL2 接 11.0592MHz 晶振 + 2×30pF 瓷片电容
           (串口波特率只能是9600等标准值的整数倍, 所以选11.0592)
3. 复位    RST 引脚 + 10uF电容 + 10K电阻: 上电瞬间高电平复位
4. EA引脚  接高电平 —— 使用片内Flash
5. 下载口  串口TXD/RXD, 通过USB转TTL(CH340)连接电脑烧录
</codeblock>
<div class="tip-box">💡 <b>为什么晶振是 11.0592MHz？</b>串口波特率发生器需要对时钟做整数分频。11.0592 = 9600 × 1152，恰好能整除出标准的9600/19200/115200波特率，误差为零。用12MHz反而会有累积误差。</div>
<h2>第一个程序：让程序从哪里开始跑</h2>
<codeblock lang="c" title="template.c — 51工程骨架(Keil C51)">
#include &lt;reg52.h&gt;          /* P0~P3、SFR寄存器定义 */

/* 12MHz下约1ms的粗略延时(标准51是12分频, 即1MHz机器周期) */
void delay_ms(unsigned int ms)
{
    unsigned int i, j;
    for (i = 0; i &lt; ms; i++)
        for (j = 0; j &lt; 114; j++)
            ;
}

void main(void)
{
    while (1) {             /* 单片机程序永远是死循环 */
        /* 你的逻辑 */
    }
}
</codeblock>
<div class="tip-box warn">⚠️ <b>单片机上电后没有"退出"概念</b>：main 里必须是 <code class="inline">while(1)</code> 死循环，程序一旦跑飞（跳出main）后果不可预测。所有"并行"的效果都是靠中断+主循环配合模拟的。</div>`,
      },
      {
        title: "GPIO：点亮第一颗LED",
        minutes: 12,
        content: `
<h2>P1.0 就是芯片上的一个开关脚</h2>
<p>51 的 IO 口是"准双向口"：内部上拉，输出0（拉低）能力强，输出1（弱上拉）能力弱。所以<b>51开发板上的LED普遍是"灌电流"接法</b>——IO输出0点亮：</p>
<codeblock lang="text" title="LED接法(共阳灌电流)">
VCC ──[LED]──[330Ω电阻]── P1.0引脚
                        IO写0 → LED亮
                        IO写1 → LED灭
</codeblock>
<codeblock lang="c" title="led.c — 闪烁与流水灯">
#include &lt;reg52.h&gt;
#include &lt;intrins.h&gt;

sbit LED1 = P1^0;           /* 单独操作P1口的第0位 */

void delay_ms(unsigned int ms)
{
    unsigned int i, j;
    for (i = 0; i &lt; ms; i++)
        for (j = 0; j &lt; 114; j++);
}

void main(void)
{
    unsigned char i;

    while (1) {
        P1 = 0xFE;          /* 1111_1110: 只有P1.0输出0 → LED1亮 */
        delay_ms(200);
        for (i = 0; i &lt; 8; i++) {          /* 流水灯: 0循环左移 */
            P1 = _crol_(P1, 1);            /* 0xFE→0xFD→0xFB... */
            delay_ms(200);
        }
    }
}
</codeblock>
<h3>三个关键理解</h3>
<ul>
  <li><code class="inline">sbit</code> 是 C51 扩展语法，把一个SFR的某一位映射成变量，本质是位寻址；</li>
  <li>整口操作 <code class="inline">P1 = 0xFE;</code> 一次写8位；位操作 <code class="inline">LED1 = 0;</code> 一次写1位；</li>
  <li>流水灯的 <code class="inline">0xFE→0xFD→0xFB</code> 就是前面C课程讲的位运算在硬件上的第一次落地。</li>
</ul>
<div class="tip-box">💡 <b>验证你的理解：</b>想只让第3、5、7号LED亮，P1 应该写多少？答案是 <code class="inline">P1 = 0x57; /* 0101_0111 */</code>——1的个数与亮灭取决于你的接法是灌电流还是拉电流，先看电路图再写代码。</div>
<h2>按键输入：读取比输出更讲究</h2>
<p>机械按键按下时会"抖动"——触点在几毫秒内反复弹跳。必须消抖：</p>
<codeblock lang="c" title="key.c — 软件消抖检测一次按下">
sbit KEY1 = P3^2;           /* 按下时读到0 */

char key_scan(void)
{
    if (KEY1 == 0) {
        delay_ms(10);                       /* 消抖: 再确认一次 */
        if (KEY1 == 0) {
            while (KEY1 == 0);              /* 等待松手(阻塞式) */
            return 1;                       /* 一次有效按键 */
        }
    }
    return 0;
}
</codeblock>
<p>阻塞式消抖简单但"等松手"期间什么都干不了——这正是下一课定时器要解决的问题的伏笔。</p>`,
      },
      {
        title: "定时器：芯片自己的节拍器",
        minutes: 14,
        content: `
<h2>延时不占用CPU的正确姿势</h2>
<p>软件延时 <code class="inline">for(j=0;j&lt;114;j++);</code> 期间CPU在空转。定时器是独立于CPU的外设：设置好初值后它自己数机器周期，数满溢出、置标志（或触发中断），CPU 该干嘛干嘛。</p>
<h3>51定时器0的模式1（16位）计算</h3>
<codeblock lang="text" title="初值计算公式">
机器周期 = 12 / 晶振频率
12MHz   → 机器周期 1us，16位定时器最大 65536us ≈ 65.5ms

定时 1ms(1000us):  初值 = 65536 - 1000 = 64536 = 0xFC18
TH0 = 0xFC;  TL0 = 0x18;

定时 50ms: 初值 = 65536 - 50000 = 15536 = 0x3CB0
(50ms × 20次 = 1秒, 累积计数法)
</codeblock>
<codeblock lang="c" title="timer.c — 定时器0中断, 500ms翻转LED">
#include &lt;reg52.h&gt;

sbit LED = P1^0;

unsigned char count = 0;

void Timer0_Init(void)
{
    TMOD &amp;= 0xF0;          /* 清定时器0控制位 */
    TMOD |= 0x01;          /* 模式1: 16位定时器 */
    TH0 = 0x3C; TL0 = 0xB0;/* 50ms @ 12MHz */
    ET0 = 1;               /* 允许定时器0中断 */
    EA  = 1;               /* 总中断允许 */
    TR0 = 1;               /* 启动定时器 */
}

void main(void)
{
    Timer0_Init();
    while (1) {
        /* CPU空闲, 可做别的事 */
    }
}

void Timer0_ISR(void) interrupt 1    /* 1 = 定时器0中断号 */
{
    TH0 = 0x3C; TL0 = 0xB0;          /* 手动重装初值(51不自动) */
    count++;
    if (count &gt;= 10) {               /* 50ms × 10 = 500ms */
        count = 0;
        LED = !LED;
    }
}
</codeblock>
<div class="tip-box">💡 <b>中断服务程序（ISR）三条军规：</b>① 尽量短，只做置标志/存数据，处理放主循环；② 与主循环共享的变量加 <code class="inline">volatile</code>，8位机上16位以上变量读写要关中断保护；③ 不要在ISR里调用阻塞延时。</div>
<h2>应用：PWM 调光/调速的雏形</h2>
<p>在定时器中断里按比例翻转IO，就是软件PWM：</p>
<codeblock lang="c" title="soft_pwm.c — 占空比75%的1kHz方波">
/* 1ms中断一次: 前0.75ms高电平, 后0.25ms低电平 */
void Timer0_ISR(void) interrupt 1
{
    TH0 = 0xFC; TL0 = 0x66;      /* 1ms @ 12MHz */
    pwm_tick++;
    if (pwm_tick &lt; 75)  OUT = 1;
    else                OUT = 0;
    if (pwm_tick &gt;= 100) pwm_tick = 0;
}
</codeblock>`,
      },
      {
        title: "外部中断与事件响应",
        minutes: 10,
        content: `
<h2>轮询 vs 中断：门铃与站门口等</h2>
<p>轮询是"每隔一秒看一眼门口"，中断是"装个门铃"。51 有两个外部中断：</p>
<codeblock lang="text" title="51中断资源速查">
INT0  (P3.2)  外部中断0   优先级高   中断号0
T0    (P3.4)  定时器0中断            中断号1
INT1  (P3.3)  外部中断1              中断号2
T1    (P3.5)  定时器1中断            中断号3
UART          串口中断               中断号4
</codeblock>
<codeblock lang="c" title="exti.c — INT0下降沿触发">
#include &lt;reg52.h&gt;

sbit LED = P1^0;
volatile unsigned char events = 0;

void ExtInt0_Init(void)
{
    IT0 = 1;        /* 1=下降沿触发, 0=低电平触发 */
    EX0 = 1;        /* 允许INT0 */
    EA  = 1;        /* 开总中断 */
}

void main(void)
{
    ExtInt0_Init();
    while (1) {
        if (events) {        /* ISR只置标志, 主循环处理 */
            events = 0;
            LED = !LED;
        }
    }
}

void Int0_ISR(void) interrupt 0
{
    events = 1;
}
</codeblock>
<div class="tip-box warn">⚠️ <b>按键+外部中断 ≠ 直接消抖：</b>抖动会产生一串下降沿，中断会被触发多次。工程做法：ISR里只置标志，主循环里消抖；或者用定时器周期扫描按键状态机（推荐，10ms扫一次，无阻塞）。</div>
<h2>实战：定时器扫描按键状态机</h2>
<codeblock lang="c" title="key_fsm.c — 无阻塞按键检测(10ms扫描)">
/* 10ms定时器中断里调用 */
void Key_Scan(void)
{
    static unsigned char state = 0;

    switch (state) {
    case 0:  if (KEY1 == 0) state = 1;  break;      /* 按下, 去抖 */
    case 1:  if (KEY1 == 0) { state = 2; key_event = 1; }
             else      state = 0;  break;           /* 确认按下 */
    case 2:  if (KEY1 == 1) state = 3;  break;      /* 松开, 去抖 */
    case 3:  if (KEY1 == 1) state = 0;  break;      /* 确认松开 */
    }
}
</codeblock>
<p>这个状态机是嵌入式面试高频题：<b>两次确认消抖 + 事件置位，全程无延时</b>。把它吃透，你的程序就从"顺序执行"进化到"事件驱动"了。</p>`,
      },
      {
        title: "串口通信（UART）入门",
        minutes: 13,
        content: `
<h2>单片机与世界的第一根线</h2>
<p>UART 是最简单的异步串行接口：两根线（TXD发送、RXD接收），约定好波特率就能通信。它没有时钟线，靠双方各自的定时器产生节拍，所以<b>波特率必须一致</b>。</p>
<codeblock lang="text" title="UART帧格式(8N1)">
空闲(1) 起始(0) D0 D1 D2 D3 D4 D5 D6 D7 校验(无) 停止(1)
 └── 常见配置 8N1: 8数据位, 无校验, 1停止位 ──┘
9600波特 = 每秒9600位 = 每位约104us
</codeblock>
<h3>波特率发生器：定时器1模式2（8位自动重装）</h3>
<codeblock lang="text" title="11.0592MHz下的计算">
TH1 = TL1 = 256 - (11059200/12/32/波特率)
波特率9600 → 256 - 3 = 253 = 0xFD   (SMOD=0)
</codeblock>
<codeblock lang="c" title="uart.c — 收发完整示例">
#include &lt;reg52.h&gt;

unsigned char rx_buf[32];
unsigned char rx_len = 0;
volatile bit rx_done = 0;

void UART_Init(void)
{
    SCON = 0x50;            /* 模式1: 8位UART, 允许接收 */
    TMOD &amp;= 0x0F;
    TMOD |= 0x20;           /* 定时器1模式2: 自动重装 */
    TH1 = TL1 = 0xFD;       /* 9600 @ 11.0592MHz */
    ES = 1;                 /* 允许串口中断 */
    EA = 1;
    TR1 = 1;                /* 启动波特率发生器 */
}

void uart_send_byte(unsigned char dat)
{
    SBUF = dat;             /* 写SBUF启动发送 */
    while (TI == 0);        /* 等待发送完成 */
    TI = 0;                 /* 软件清发送标志 */
}

void main(void)
{
    UART_Init();
    uart_send_byte('H');
    while (1) {
        if (rx_done) {                       /* 收到一帧 */
            unsigned char i;
            rx_done = 0;
            for (i = 0; i &lt; rx_len; i++)     /* 回显 */
                uart_send_byte(rx_buf[i]);
            rx_len = 0;
        }
    }
}

void UART_ISR(void) interrupt 4
{
    if (RI) {                 /* 收到一个字节 */
        RI = 0;
        if (rx_len &lt; 32) rx_buf[rx_len++] = SBUF;
        if (SBUF == '\\n') rx_done = 1;   /* 换行视为一帧结束 */
    }
}
</codeblock>
<div class="tip-box">💡 <b>调试神器：</b>把传感器的原始值、状态机切换、关键分支都 <code class="inline">printf</code>/发送出来，用串口助手看。没有串口日志的嵌入式调试是盲调。后续上STM32时，重定向 <code class="inline">printf</code> 到串口是必备技能。</div>
<h3>本章小结</h3>
<ul>
  <li>UART三要素：波特率、数据位、停止位，双方一致才能通；</li>
  <li>发送"写SBUF等TI"，接收"RI中断读SBUF"；</li>
  <li>定长帧/换行帧/超时帧是三种常见的分包策略。</li>
</ul>`,
      },
    ],
  },

  {
    id: "stm32",
    title: "STM32开发实战",
    icon: "⚙️",
    gradient: "linear-gradient(135deg,#0891b2,#7c3aed)",
    level: "进阶",
    desc: "以STM32F103 + HAL库为主线：工程结构、外设驱动（USART/I2C/SPI）、定时器PWM与ADC+DMA，覆盖90%的竞赛与项目场景。",
    tags: ["HAL库", "USART", "I2C/SPI", "PWM", "ADC+DMA"],
    lessons: [
      {
        title: "开发环境与工程结构",
        minutes: 12,
        content: `
<h2>从51到STM32，变了什么</h2>
<p>STM32F103 是 32位 Cortex-M3 内核，72MHz、64KB RAM、512KB Flash，外设用"寄存器+库函数"两层访问。你不再直接背寄存器地址，而是用 <b>ST官方HAL库</b>（或LL库/寄存器）编程。</p>
<h3>标准开发流程（CubeMX + IDE）</h3>
<codeblock lang="text" title="工具链全景">
1. STM32CubeMX   图形化配置引脚/时钟/外设 → 生成初始化代码
2. IDE三选一:
   - Keil MDK (生态最全, 教程最多)
   - STM32CubeIDE (免费官方, 基于Eclipse)
   - VS Code + ARM GCC + Makefile (开源爱好者的选择)
3. 下载器: ST-Link V2 (SWD两线下载+调试) ≈ 20元
</codeblock>
<h2>生成的工程长什么样</h2>
<codeblock lang="c" title="main.c — CubeMX生成的骨架(精简)">
#include "main.h"
#include "gpio.h"

int main(void)
{
    HAL_Init();               /* HAL库初始化: SysTick 1ms */
    SystemClock_Config();     /* 时钟树: HSE 8MHz → PLL ×9 → 72MHz */
    MX_GPIO_Init();           /* CubeMX生成的外设初始化 */

    while (1)
    {
        HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
        HAL_Delay(500);       /* 基于SysTick的毫秒延时 */
    }
}
</codeblock>
<h3>回调机制：HAL库的"中断处理哲学"</h3>
<p>HAL把ISR分成了两层：库内部的中断服务函数负责清标志、搬运数据，然后把<b>用户关心的部分抽成弱定义（weak）回调</b>给你重写：</p>
<codeblock lang="c" title="回调示例">
/* 在stm32f1xx_it.c里(库生成, 别动):
   void USART1_IRQHandler(void) { HAL_UART_IRQHandler(&amp;huart1); } */

/* 在main.c里(你写的): 接收完成回调 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart-&gt;Instance == USART1) {
        /* 处理 rx_data, 重新启动接收 */
        HAL_UART_Receive_IT(&amp;huart1, &amp;rx_data, 1);
    }
}
</codeblock>
<div class="tip-box">💡 <b>调试技能优先级：</b>断点单步（HAL_Delay也能打断点）＞ 串口日志 ＞ GPIO翻转+逻辑分析仪。学会看 <code class="inline">.map</code> 文件查Flash/RAM占用，学会用 <code class="inline">arm-none-eabi-size</code> 对比优化前后体积。</div>`,
      },
      {
        title: "GPIO与流水灯实战",
        minutes: 10,
        content: `
<h2>两种输出模式的选择</h2>
<p>CubeMX 里 GPIO 有推挽输出（Push-Pull）与开漏输出（Open-Drain）两种常见模式：</p>
<ul>
  <li><b>推挽</b>：能主动输出高低电平，驱动LED、控制使能脚都用它；</li>
  <li><b>开漏</b>：只能拉低，高电平靠外部上拉——用于电平转换和"线与"（I2C总线就是这样）；</li>
  <li><b>上/下拉输入</b>：按键检测，浮空输入容易受干扰。</li>
</ul>
<codeblock lang="c" title="led.c — HAL库版流水灯">
/* CubeMX配置: PA4~PA7 → GPIO_Output, 默认高(LED共阳) */
uint8_t pin_map[4] = {GPIO_PIN_4, GPIO_PIN_5, GPIO_PIN_6, GPIO_PIN_7};

for (uint8_t i = 0; i &lt; 4; i++) {
    HAL_GPIO_WritePin(GPIOA, pin_map[i], GPIO_PIN_RESET);  /* 亮 */
    HAL_Delay(150);
    HAL_GPIO_WritePin(GPIOA, pin_map[i], GPIO_PIN_SET);    /* 灭 */
}
</codeblock>
<h2>软件定时替代 HAL_Delay</h2>
<p><code class="inline">HAL_Delay</code> 是忙等阻塞。任务一多就要用"时间片轮询"骨架：</p>
<codeblock lang="c" title="scheduler.c — 裸机多任务轮询框架">
typedef struct {
    uint32_t period;         /* 周期ms */
    uint32_t last;           /* 上次执行时刻 */
    void (*task)(void);      /* 任务函数指针 */
} SoftTimer;

void task_led(void)      { HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13); }
void task_key(void)      { Key_Scan(); }
void task_sensor(void)   { Sensor_Read(); }

SoftTimer timers[] = {
    { 500, 0, task_led },
    {  10, 0, task_key },
    { 200, 0, task_sensor },
};

while (1) {
    uint32_t now = HAL_GetTick();        /* SysTick毫秒计数 */
    for (uint8_t i = 0; i &lt; 3; i++) {
        if (now - timers[i].last &gt;= timers[i].period) {
            timers[i].last = now;
            timers[i].task();            /* 各任务互不阻塞 */
        }
    }
}
</codeblock>
<div class="tip-box">💡 <b>这个 while(1) 轮询框架是裸机项目的万能骨架</b>，配合HAL_GetTick实现非阻塞定时。当任务超过10个或有硬实时要求时，就该升级到 FreeRTOS 了——本站第四门课见。</div>`,
      },
      {
        title: "USART串口与printf重定向",
        minutes: 13,
        content: `
<h2>阻塞发送 vs 中断/DMA发送</h2>
<codeblock lang="c" title="uart.c — 三种发送方式">
/* 1. 阻塞: 简单可靠, 但等最后一字节发完才返回 */
HAL_UART_Transmit(&amp;huart1, (uint8_t *)"hello\\r\\n", 7, 100);

/* 2. 中断: 立即返回, 后台逐字节发, 发完触发回调 */
HAL_UART_Transmit_IT(&amp;huart1, buf, len);

/* 3. DMA: 立即返回, 硬件搬运, CPU零占用 —— 长日志首选 */
HAL_UART_Transmit_DMA(&amp;huart1, buf, len);
</codeblock>
<h2>printf 重定向：嵌入式调试的标配</h2>
<p>让 <code class="inline">printf</code> 从串口输出，只需重写一个字符输出函数：</p>
<codeblock lang="c" title="retarget.c">
#include &lt;stdio.h&gt;
#include "usart.h"

/* Keil MicroLIB 方案 */
int fputc(int ch, FILE *f)
{
    HAL_UART_Transmit(&amp;huart1, (uint8_t *)&amp;ch, 1, 0xFFFF);
    return ch;
}

/* GCC (CubeIDE) 方案: 重写 _write */
int _write(int fd, char *ptr, int len)
{
    HAL_UART_Transmit(&amp;huart1, (uint8_t *)ptr, len, 0xFFFF);
    return len;
}

/* 用法: printf("temp=%.1f, count=%d\\r\\n", temp, count); */
</codeblock>
<div class="tip-box warn">⚠️ <b>两个必踩的坑：</b>① Keil 要勾选 <i>Use MicroLIB</i>，否则 printf 卡死在半主机模式；② printf 里的 <code class="inline">%f</code> 默认不支持，Keil需加 <code class="inline">--printf=... 或勾选浮点支持</code>，或自己用整数千分位拼接。另外 ISR 里别直接 printf（不可重入），先置标志回主循环打。</div>
<h2>中断接收：不定长数据帧</h2>
<codeblock lang="c" title="rx_idle.c — 空闲中断+DMA接收不定长帧(竞赛常用)">
/* 启动: DMA循环收, IDLE(空闲)中断判帧结束 */
HAL_UART_Receive_DMA(&amp;huart1, rx_buf, sizeof(rx_buf));
__HAL_UART_ENABLE_IT(&amp;huart1, UART_IT_IDLE);

void USART1_IRQHandler(void)
{
    if (__HAL_UART_GET_FLAG(&amp;huart1, UART_FLAG_IDLE)) {
        __HAL_UART_CLEAR_IDLEFLAG(&amp;huart1);
        HAL_UART_DMAStop(&amp;huart1);
        rx_len = sizeof(rx_buf) - __HAL_DMA_GET_COUNTER(huart1.hdmarx);
        frame_ready = 1;                       /* 主循环处理rx_buf */
        HAL_UART_Receive_DMA(&amp;huart1, rx_buf, sizeof(rx_buf));
    }
}
</codeblock>
<p>"发送方只要停发超过一个字节时间就算一帧结束"——空闲中断方案能优雅处理任意长度指令帧，是电赛、机器人通信的标配。</p>`,
      },
      {
        title: "I2C与SPI总线协议",
        minutes: 15,
        content: `
<h2>两线挂一串：I2C</h2>
<p>I2C 用 <b>SDA（数据）+ SCL（时钟）</b>两根开漏线，靠上拉电阻（4.7K）保持高电平，支持一主多从。每个从设备有7位地址，典型外设：OLED(SSD1306, 0x3C)、MPU6050(0x68)、AT24C02 EEPROM(0x50)。</p>
<codeblock lang="text" title="I2C一次写操作时序">
START → 从机地址(7bit)+写位(0) → ACK
      → 寄存器地址 → ACK
      → 数据... → ACK → STOP
      所有数据高位在前, 每字节后从机回ACK
</codeblock>
<codeblock lang="c" title="oled_i2c.c — HAL库I2C读写">
/* OLED写命令: 0x00=命令前缀, 0x40=数据前缀(SSD1306约定) */
uint8_t cmd[2] = {0x00, 0xAE};       /* 0xAE: 关显示 */
HAL_I2C_Master_Transmit(&amp;hi2c1, 0x3C &lt;&lt; 1, cmd, 2, 100);
/*                    ^注意: HAL要求7位地址左移1位 */

/* 读写MPU6050陀螺仪寄存器 */
uint8_t reg = 0x75, who = 0;
HAL_I2C_Mem_Write(&amp;hi2c1, 0x68&lt;&lt;1, &amp;reg, 1, NULL, 0, 100);
HAL_I2C_Mem_Read (&amp;hi2c1, 0x68&lt;&lt;1, 0x75, 1, &amp;who, 1, 100);
/* who 应读到 0x68 —— 传感器在线检测的标准姿势 */
</codeblock>
<h2>四线高速：SPI</h2>
<p>SPI 用 <b>SCK/MISO/MOSI/CS</b> 四线，全双工、速度快（几十MHz），典型外设：TFT彩屏、SD卡、W25Q64 Flash。模式由 CPOL/CPHA 决定，最常用 Mode 0。</p>
<codeblock lang="c" title="flash_spi.c — SPI读写W25Q64芯片ID">
uint8_t cmd = 0x9F, id[3];

HAL_GPIO_WritePin(CS_GPIO_Port, CS_Pin, GPIO_PIN_RESET);   /* 片选拉低 */
HAL_SPI_Transmit(&amp;hspi1, &amp;cmd, 1, 100);                    /* 发命令 */
HAL_SPI_Receive (&amp;hspi1, id, 3, 100);                      /* 收ID */
HAL_GPIO_WritePin(CS_GPIO_Port, CS_Pin, GPIO_PIN_SET);     /* 释放 */

/* id = {0xEF, 0x40, 0x17} 即 W25Q64 在线 */
</codeblock>
<h3>选型口诀</h3>
<ul>
  <li>低速、多设备、引脚紧张 → <b>I2C</b>（传感器、EEPROM、OLED）；</li>
  <li>高速、大吞吐 → <b>SPI</b>（屏幕、Flash、SD卡）；</li>
  <li>远距离、抗干扰 → <b>UART+485/CAN</b>。</li>
</ul>
<div class="tip-box warn">⚠️ <b>I2C总线卡死救援：</b>从机拉死SDA时，主机手动输出9个SCL时钟+一个STOP即可解锁。调试I2C不通先查：上拉电阻在不在、地址有没有左移、用逻辑分析仪看波形（15元的24MHz USB逻辑分析仪+PulseView完全够用）。</div>`,
      },
      {
        title: "定时器与PWM电机控制",
        minutes: 14,
        content: `
<h2>STM32定时器家族</h2>
<ul>
  <li><b>高级定时器 TIM1/TIM8</b>：带死区互补输出，专门驱动三相电机/逆变器；</li>
  <li><b>通用定时器 TIM2~TIM5</b>：PWM、输入捕获、编码器接口，最常用；</li>
  <li><b>基本定时器 TIM6/TIM7</b>：只能定时+触发DAC。</li>
</ul>
<h3>PWM频率与占空比计算</h3>
<codeblock lang="text" title="定时器溢出公式">
PWM频率 = 定时器时钟 / (预分频PSC+1) / (自动重装ARR+1)
例: 72MHz, PSC=71, ARR=999
    → 72MHz / 72 / 1000 = 1kHz, 占空比分辨率 1/1000
占空比 = CCR / (ARR+1) × 100%
</codeblock>
<codeblock lang="c" title="pwm.c — 直流电机调速(L298N驱动)">
/* CubeMX: TIM3 CH1 → PWM输出, PSC=71, ARR=999 */
HAL_TIM_PWM_Start(&amp;htim3, TIM_CHANNEL_1);

void motor_set_speed(uint16_t duty)      /* duty: 0~1000 */
{
    __HAL_TIM_SET_COMPARE(&amp;htim3, TIM_CHANNEL_1, duty);
}

void motor_set_dir(uint8_t forward)      /* 方向脚 */
{
    HAL_GPIO_WritePin(IN1_GPIO_Port, IN1_Pin,
        forward ? GPIO_PIN_SET : GPIO_PIN_RESET);
    HAL_GPIO_WritePin(IN2_GPIO_Port, IN2_Pin,
        forward ? GPIO_PIN_RESET : GPIO_PIN_SET);
}
</codeblock>
<h2>编码器接口：测转速</h2>
<p>定时器可以直接接正交编码器（A/B两相），硬件自动加减计数，CPU零开销：</p>
<codeblock lang="c" title="encoder.c">
/* CubeMX: TIM4 → Encoder Mode TI12, PSC=0, ARR=65535 */
HAL_TIM_Encoder_Start(&amp;htim4, TIM_CHANNEL_ALL);

int16_t Encoder_Read(void)
{
    int16_t cnt = (int16_t)__HAL_TIM_GET_COUNTER(&amp;htim4);
    __HAL_TIM_SET_COUNTER(&amp;htim4, 0);     /* 读后清零 = 测周期增量 */
    return cnt;
}
/* 10ms读一次: 转速RPM = cnt / (4×线数) × 6000 / 减速比 */
</codeblock>
<div class="tip-box">💡 <b>PID调速闭环</b> = 编码器测速 + PWM输出。拿增量式PID起步：只需上次误差、上次输出两个变量。调参口诀"先P后I再D"：P从小往上加到微振荡，回退60%，再补I消静差。这是电赛控制题的基本功。</div>`,
      },
      {
        title: "ADC采集与DMA传输",
        minutes: 12,
        content: `
<h2>从电压到数字</h2>
<p>STM32F103 内置12位逐次逼近ADC，参考电压3.3V：</p>
<codeblock lang="text" title="换算公式">
电压 = ADC值 / 4095.0 × 3.3V
分辨率 = 3.3 / 4096 ≈ 0.8mV
</codeblock>
<codeblock lang="c" title="adc.c — 阻塞单次采集">
/* CubeMX: PA0 → ADC1_IN0 */
HAL_ADC_Start(&amp;hadc1);
if (HAL_ADC_PollForConversion(&amp;hadc1, 10) == HAL_OK) {
    uint16_t raw = HAL_ADC_GetValue(&amp;hadc1);
    float volt = raw / 4095.0f * 3.3f;
    printf("ADC=%u  U=%.3fV\\r\\n", raw, volt);
}
HAL_ADC_Stop(&amp;hadc1);
</codeblock>
<h2>DMA：让硬件帮你搬数据</h2>
<p>采集8路传感器、需要连续采样的场景，用 <b>DMA循环模式</b>，ADC不停把结果写进内存数组，CPU完全不管：</p>
<codeblock lang="c" title="adc_dma.c — 多通道连续采集">
/* CubeMX: ADC1 IN0~IN3 四通道, Scan+Continuous+DMA循环模式 */
volatile uint16_t adc_buf[4];       /* DMA自动填充 */

HAL_ADC_Start_DMA(&amp;hadc1, (uint32_t *)adc_buf, 4);

/* 主循环里随时取最新值做滑动平均滤波 */
#define N 16
uint16_t get_filtered(uint8_t ch)
{
    static uint16_t win[4][N] = {0};
    static uint8_t  idx = 0;
    uint32_t sum = 0;

    win[ch][idx] = adc_buf[ch];
    for (uint8_t i = 0; i &lt; N; i++) sum += win[ch][i];
    return (uint16_t)(sum / N);
}
</codeblock>
<div class="tip-box warn">⚠️ <b>ADC采不准排查清单：</b>① 输入阻抗过大（&gt;10K）→ 前级加运放跟随或加电容；② VDDA没接干净 → 磁珠+滤波电容；③ 精密测量把内部Vrefint校准算上；④ 高频信号注意采样时间档位（CubeMX里Sample Time）。</div>
<h3>实战项目闭环</h3>
<ul>
  <li><b>循迹小车</b>：ADC/红外对管 → 误差 → PID → PWM差速；</li>
  <li><b>电池监测</b>：分压电阻 → ADC → 滑动平均 → 电量映射；</li>
  <li><b>温度采集</b>：NTC分压 → ADC → 查表/B方程换算 → 串口上报。</li>
</ul>
<p>到这里，GPIO/串口/总线/定时器/ADC 五大外设你已经全部打通， STM32 实战的核心就这些——剩下的都是在组合它们。</p>`,
      },
    ],
  },

  {
    id: "rtos",
    title: "FreeRTOS实时操作系统",
    icon: "🧵",
    gradient: "linear-gradient(135deg,#f59e0b,#ea580c)",
    level: "进阶",
    desc: "从裸机轮询到多任务并发：任务调度、队列、信号量、互斥锁。搞懂RTOS，才算真正写过'工程级'嵌入式代码。",
    tags: ["任务调度", "队列", "信号量", "优先级"],
    lessons: [
      {
        title: "为什么需要RTOS：裸机与RTOS对比",
        minutes: 11,
        content: `
<h2>裸机的天花板</h2>
<p>前一课的轮询框架能撑住简单项目，但遇到这些问题就吃力了：</p>
<ul>
  <li>某个任务突然要跑 50ms（如OLED刷新），其他任务全部被拖慢——<b>时间片失控</b>；</li>
  <li>十几条状态机互相嵌套，改一处崩全局——<b>复杂度爆炸</b>；</li>
  <li>"紧急的事"和"不紧急的事"没法分开优先处理。</li>
</ul>
<h2>RTOS 的三个承诺</h2>
<codeblock lang="text" title="裸机 vs FreeRTOS">
             裸机轮询              FreeRTOS
并发模型     手写状态机+标志位       每个功能一个任务, 独立栈
实时性       取决于最慢的任务        抢占式调度, 高优先级先跑
通信同步     全局变量+volatile       队列/信号量/事件组, 线程安全
响应延迟     不可预测                最坏情况可计算(实时性!)
</codeblock>
<p><b>"实时"不是"快"，而是"按时"</b>——最坏响应时间有上界，可以证明。这就是 RTOS（Real-Time OS）名字的含义。</p>
<h3>FreeRTOS 最小工程</h3>
<codeblock lang="c" title="main.c — CubeMX生成的FreeRTOS工程">
#include "cmsis_os.h"

/* 任务函数: 永不返回的循环 */
void StartLedTask(void *argument)
{
    for (;;) {
        HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
        osDelay(500);                 /* 让出CPU, 500ms后再跑 */
    }
}

void StartUartTask(void *argument)
{
    for (;;) {
        Uart_Process();               /* 处理串口帧 */
        osDelay(10);
    }
}

/* CubeMX自动生成, 你的工作只是填任务函数 */
osThreadDef(ledTask, StartLedTask, osPriorityNormal, 0, 128);
</codeblock>
<div class="tip-box">💡 <b>两种任务体写法：</b>周期性任务用 <code class="inline">osDelay(周期)</code>（相对延时，不会累积漂移）；事件驱动任务用 <code class="inline">osMessageQueueGet(queue, ..., osWaitForever)</code> 阻塞等消息——没有事件就完全不占CPU。</div>
<h3>什么样的项目该上RTOS</h3>
<ul>
  <li>任务 ≥ 5 个且实时性要求不同（如 1ms 控制环 + 100ms 显示）；</li>
  <li>需要网络/文件系统/USB 等中间件（FreeRTOS 生态齐全）；</li>
  <li>多人协作、代码要长期维护。</li>
</ul>`,
      },
      {
        title: "任务与调度器",
        minutes: 13,
        content: `
<h2>优先级决定一切</h2>
<p>FreeRTOS 是<b>抢占式优先级调度</b>：永远运行就绪任务中优先级最高的那个。同优先级按时间片轮转（需开启 configUSE_TIME_SLICING）。</p>
<codeblock lang="text" title="任务状态机">
        创建
         ↓
     ┌─就绪 Ready ─┐  被更高优先级抢占
     │              ↘
     │               运行 Running
  调度器选中           ↙        ↘
     ↑        优先级更高任务就绪   osDelay/等信号量
     │              ↙            ↘
     └─────←──────┘        阻塞 Blocked
                                ↓ 超时/事件到达
                              回到就绪
</codeblock>
<h3>任务创建：静态 vs 动态</h3>
<codeblock lang="c" title="tasks.c — 两种创建方式">
/* 方式1: 动态创建 — 栈和TCB从FreeRTOS堆分配(默认) */
BaseType_t ok = xTaskCreate(
    vSensorTask,          /* 任务函数 */
    "sensor",             /* 名字(调试用) */
    256,                  /* 栈深度: 单位是"字"(4字节), 256=1KB */
    NULL,                 /* 传参 */
    3,                    /* 优先级: 数字越大越高 */
    &amp;xSensorHandle);      /* 句柄, 供vTaskDelete等使用 */

/* 方式2: 静态创建 — 内存自己给, 航空/医疗等MISRA场景用 */
StaticTask_t xTCB;
StackType_t  xStack[256];
xTaskCreateStatic(vSensorTask, "sensor", 256, NULL, 3,
                  xStack, &amp;xTCB);
</codeblock>
<div class="tip-box warn">⚠️ <b>栈溢出是RTOS第一大杀手：</b>症状是随机死机/硬fault。开 <code class="inline">configCHECK_FOR_STACK_OVERFLOW=2</code> + 钩子函数抓现行；用 <code class="inline">uxTaskGetStackHighWaterMark()</code> 查各任务栈的历史最低水位，留20%余量。</div>
<h2>空闲任务与CPU占用率</h2>
<ul>
  <li>调度器启动后自动创建<b>空闲任务</b>（最低优先级），它的意义是"有CPU空转可统计"；</li>
  <li>用 <code class="inline">vTaskGetRunTimeStats()</code> 输出各任务CPU占用——性能优化的第一步是测量；</li>
  <li>空闲钩子函数里可以喂狗或进低功耗。</li>
</ul>
<h3>临界区：别保护过头</h3>
<codeblock lang="c" title="critical.c">
/* 短临界区: 关中断(只关到配置的屏蔽级), 几微秒~几微秒级 */
taskENTER_CRITICAL();
    shared_counter++;          /* 会被ISR和多个任务访问 */
taskEXIT_CRITICAL();

/* ISR版本 */
UBaseType_t saved = taskENTER_CRITICAL_FROM_ISR();
    ...
taskEXIT_CRITICAL_FROM_ISR(saved);
</codeblock>
<p>原则：<b>临界区越短越好</b>，能换成队列/信号量就不要关中断。长临界区会拖垮整个系统的实时性。</p>`,
      },
      {
        title: "队列：任务间通信的正确方式",
        minutes: 12,
        content: `
<h2>不要共享变量，传消息</h2>
<p>两个任务同时读写一个全局变量，没有保护就是竞态。FreeRTOS 的答案是<b>队列（Queue）</b>：拷贝传递、自带阻塞与线程安全，是任务/中断间通信的首选。</p>
<codeblock lang="c" title="queue.c — 传感器任务→处理任务">
typedef struct {
    uint8_t  ch;
    uint16_t value;
} SensorMsg;

QueueHandle_t xSensorQueue;

void Sender_Task(void *p)          /* 生产者 */
{
    SensorMsg msg = {0};
    for (;;) {
        msg.ch = 0;
        msg.value = ADC_Read();
        /* 队列满则等10ms; 0超时=不等待 */
        xQueueSend(xSensorQueue, &amp;msg, pdMS_TO_TICKS(10));
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void Worker_Task(void *p)          /* 消费者 */
{
    SensorMsg msg;
    for (;;) {
        /* 空队列则无限阻塞 — 事件驱动, 零CPU占用 */
        if (xQueueReceive(xSensorQueue, &amp;msg, portMAX_DELAY) == pdTRUE) {
            Process(&amp;msg);
        }
    }
}

/* main里: 长度10、每个元素sizeof(SensorMsg) */
xSensorQueue = xQueueCreate(10, sizeof(SensorMsg));
</codeblock>
<h3>队列的三个特性</h3>
<ul>
  <li><b>值拷贝</b>：入队把数据整个复制进去。大块数据（如摄像头帧）改成"拷贝指针"，内存用静态缓冲池管理；</li>
  <li><b>FIFO + 可插队</b>：<code class="inline">xQueueSendToFront()</code> 让紧急消息插队；</li>
  <li><b>多对一/一对多</b>：任意数量的任务和ISR都能往同一个队列收发。</li>
</ul>
<div class="tip-box">💡 <b>ISR专用API：</b>中断里必须用 <code class="inline">xQueueSendFromISR()</code>，并且检查唤醒了谁：<code class="inline">portYIELD_FROM_ISR(xHigherPriorityTaskWoken)</code> 立即切到被唤醒的高优先级任务，减小延迟。</div>
<h2>实战：串口收发解耦</h2>
<codeblock lang="c" title="uart_queue.c — 经典三任务结构">
/* UART ISR → rxQueue(字节流) → UartTask(组帧) → cmdQueue(完整帧) → CmdTask(执行)
   每个环节只依赖队列, 不依赖对方内部实现 — 这就是解耦 */
void UART_IRQHandler(void)
{
    uint8_t byte = USART1-&gt;DR;
    BaseType_t woken = pdFALSE;
    xQueueSendFromISR(xRxQueue, &amp;byte, &amp;woken);
    portYIELD_FROM_ISR(woken);
}
</codeblock>`,
      },
      {
        title: "信号量与互斥锁",
        minutes: 14,
        content: `
<h2>信号量：事件通知与资源计数</h2>
<p>信号量像一个带计数的容器：<code class="inline">Give</code> 放进去一个，<code class="inline">Take</code> 取走一个，取不到就阻塞。</p>
<codeblock lang="c" title="sem.c — 二值信号量: ISR通知任务">
SemaphoreHandle_t xSem;

void Button_IRQHandler(void)          /* ISR: 事件发生 */
{
    BaseType_t woken = pdFALSE;
    xSemaphoreGiveFromISR(xSem, &amp;woken);    /* 计数+1 */
    portYIELD_FROM_ISR(woken);
}

void Button_Task(void *p)             /* 任务: 等事件 */
{
    for (;;) {
        if (xSemaphoreTake(xSem, portMAX_DELAY) == pdTRUE) {
            Beep();                    /* 慢处理放任务里, 不放ISR */
        }
    }
}

/* 计数信号量: 管理N个同类资源, 如5个DMA通道 */
xCountSem = xSemaphoreCreateCounting(5, 5);   /* 最大5, 初始5 */
</codeblock>
<h2>互斥锁：保护共享资源</h2>
<p>多个任务抢同一个资源（打印一条完整日志、写Flash），用<b>互斥锁（Mutex）</b>：</p>
<codeblock lang="c" title="mutex.c — 打印机的例子">
SemaphoreHandle_t xPrintMutex;

void Log_Task1(void *p)
{
    for (;;) {
        if (xSemaphoreTake(xPrintMutex, portMAX_DELAY) == pdTRUE) {
            printf("[task1] sensor=%d state=%d\\r\\n", a, b);
            xSemaphoreGive(xPrintMutex);
        }
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
/* 没有锁时: task1打印到一半被task2插进来, 日志交叉成乱码 */
</codeblock>
<h3>信号量 vs 互斥锁，别再用错</h3>
<codeblock lang="text" title="对比表">
              信号量                 互斥锁
语义          "事件发生了"/"有资源"   "这东西我在用, 别碰"
典型用途      ISR通知任务、任务同步    保护共享外设/数据结构
优先级继承    无                     有(防优先级反转)
谁给谁        任何任务/ISR可以Give    谁Take必须谁Give(配对)
</codeblock>
<div class="tip-box warn">⚠️ <b>优先级反转经典事故：</b>低优先级任务持锁 → 高优先级任务等锁 → 中优先级任务插队狂跑。互斥锁的<b>优先级继承</b>机制会临时抬升持锁者优先级解决此问题——这就是"保护共享资源必须用Mutex而不是二值信号量"的原因（火星探路者号1997年真实事故）。</div>
<h3>死锁预防清单</h3>
<ul>
  <li>多把锁的场景，所有任务按<b>相同顺序</b>加锁；</li>
  <li>Take 时永远带超时，别 portMAX_DELAY 死等；</li>
  <li>持锁期间不调用可能阻塞的函数；</li>
  <li>能设计成"只通过队列传数据"就根本不需要锁——消息传递优于共享内存。</li>
</ul>`,
      },
      {
        title: "软件定时器与事件组",
        minutes: 10,
        content: `
<h2>软件定时器：osDelay 的优雅替代</h2>
<p>回调在定时器服务任务（Daemon）上下文里执行，<b>必须短小，绝不能阻塞</b>：</p>
<codeblock lang="c" title="swtimer.c">
TimerHandle_t xBlinkTimer;

void BlinkCallback(TimerHandle_t t)     /* 回调: 只做轻活 */
{
    HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
}

/* 创建: 单次(ptimerONESHOT) vs 周期(pdTRUE) */
xBlinkTimer = xTimerCreate("blink", pdMS_TO_TICKS(500),
                           pdTRUE, NULL, BlinkCallback);
xTimerStart(xBlinkTimer, 0);            /* 最后参数是等待tick */

/* 运行中改周期: xTimerChangePeriod(t, 新周期, 0) */
</codeblock>
<h2>事件组：多条件同步</h2>
<p>任务要等"多个事件都到齐"时（如：等待 WiFi连上<b>且</b> 时间同步<b>且</b> 配置加载完成 才开始工作），事件组比多个信号量清晰得多：</p>
<codeblock lang="c" title="eventgroup.c">
EventGroupHandle_t xSysEvent;
#define EV_WIFI      (1 &lt;&lt; 0)
#define EV_NTP       (1 &lt;&lt; 1)
#define EV_CONFIG    (1 &lt;&lt; 2)

void Wifi_Task(void *p)   { /* 连接成功后 */ xEventGroupSetBits(xSysEvent, EV_WIFI); }
void Ntp_Task(void *p)    { xEventGroupSetBits(xSysEvent, EV_NTP); }
void Cfg_Task(void *p)    { xEventGroupSetBits(xSysEvent, EV_CONFIG); }

void App_Task(void *p)
{
    for (;;) {
        /* 等三个事件全部就绪, 才往下走 */
        EventBits_t bits = xEventGroupWaitBits(xSysEvent,
            EV_WIFI | EV_NTP | EV_CONFIG,
            pdFALSE,          /* 退出时不清除 */
            pdTRUE,           /* pdTRUE=全部满足(AND), pdFALSE=任一(OR) */
            portMAX_DELAY);
        Start_Application();
        vTaskDelay(portMAX_DELAY);
    }
}
</codeblock>
<h3>FreeRTOS 工具选型速查</h3>
<ul>
  <li>传数据 → <b>队列</b>；</li>
  <li>通知事件（一对一最高效）→ <b>任务通知 TaskNotify</b>（比信号量快45%且省RAM）；</li>
  <li>事件同步（多条件组合）→ <b>事件组</b>；</li>
  <li>保护共享资源 → <b>互斥锁</b>；</li>
  <li>周期执行轻回调 → <b>软件定时器</b>。</li>
</ul>
<div class="tip-box">💡 <b>学习检验：</b>能独立写出"串口ISR收字节→队列→组帧任务→命令队列→执行任务→结果通过事件组通知UI任务刷新"这套完整链路，FreeRTOS 就算入门了。这正是绝大多数实际项目的通信骨架。</div>`,
      },
    ],
  },

  {
    id: "embedded-linux",
    title: "嵌入式Linux基础",
    icon: "🐧",
    gradient: "linear-gradient(135deg,#6366f1,#db2777)",
    level: "高级",
    desc: "从单片机迈入系统级开发：交叉编译、启动流程、根文件系统与设备树，看懂一块Linux开发板从上电到出Shell的全过程。",
    tags: ["交叉编译", "Bootloader", "文件系统", "设备树"],
    lessons: [
      {
        title: "嵌入式Linux全景图",
        minutes: 10,
        content: `
<h2>单片机和嵌入式Linux差在哪</h2>
<codeblock lang="text" title="两条技术路线对比">
            MCU(STM32等)           嵌入式Linux(树莓派/i.MX/瑞芯微)
内核        Cortex-M, 无MMU        Cortex-A, 带MMU+多级缓存
系统        裸机/RTOS              完整Linux内核+用户空间
内存        KB级                   MB~GB级
外设访问    寄存器/库函数           驱动文件(/dev) + sysfs
开发范式    交叉编译C工程           交叉编译 + 应用生态(Shell/Python/Qt)
典型产品    电饭煲/传感器节点        智能音箱/网关/车机/工控屏
</codeblock>
<h2>软件栈五层</h2>
<codeblock lang="text" title="从下到上">
┌──────────────────────────────┐
│ 应用层: 你的程序 / Shell / Qt │
├──────────────────────────────┤
│ 库层: glibc/musl, Python ...  │
├──────────────────────────────┤
│ 内核: Linux (调度/内存/驱动)   │
├──────────────────────────────┤
│ Bootloader: U-Boot            │
├──────────────────────────────┤
│ 硬件: SoC(Cortex-A) + DDR + eMMC
└──────────────────────────────┘
</codeblock>
<h3>上电到出命令行，发生了什么</h3>
<ul>
  <li><b>BootROM</b>：芯片内部固化代码，从启动介质（eMMC/SD/SPI Flash）加载一级引导；</li>
  <li><b>U-Boot</b>：初始化DDR、加载内核镜像和设备树到内存，启动内核；</li>
  <li><b>Linux内核</b>：解压、初始化各子系统、挂载根文件系统、启动第一个进程 init（PID=1）；</li>
  <li><b>init 系统</b>：按配置启动各服务，最后出登录Shell。</li>
</ul>
<div class="tip-box">💡 <b>学习路线建议：</b>手里有一块板子（树莓派、香橙派，或正点原子/野火的i.MX6ULL开发板）+ 一个Linux环境（虚拟机Ubuntu或WSL2）。嵌入式Linux开发<b>必须</b>先熟悉Linux本身——本课默认你在Ubuntu下操作。</div>`,
      },
      {
        title: "交叉编译工具链",
        minutes: 12,
        content: `
<h2>为什么不能在PC上直接编译</h2>
<p>你的Ubuntu跑在 x86_64 上，而目标板是 ARM。在A平台编译出B平台可执行文件，就是<b>交叉编译（Cross Compile）</b>。</p>
<codeblock lang="bash" title="工具链三件套与命名">
# 工具链命名规则: arch-vendor-os-libc
arm-linux-gnueabihf-gcc    # ARM + Linux + 硬浮点 + glibc
aarch64-linux-gnu-gcc      # 64位ARM (树莓派4/Cortex-A53+)

# Ubuntu安装
sudo apt install gcc-arm-linux-gnueabihf gcc-aarch64-linux-gnu

# 使用: 只要把gcc换成交叉gcc
arm-linux-gnueabihf-gcc hello.c -o hello
file hello    # ELF 32-bit LSB executable, ARM, EABI5
</codeblock>
<h3>动态链接、静态链接与库</h3>
<codeblock lang="bash" title="在目标板上">
# 动态编译的程序需要板上有对应libc:
$ file hello
  dynamically linked, interpreter /lib/ld-linux-armhf.so.3

# 查依赖: 交叉readelf
arm-linux-gnueabihf-readelf -d hello | grep NEEDED
  NEEDED  libm.so.6   libgcc_s.so.1   libc.so.6

# 静态编译一劳永逸(体积大, 但拷过去就能跑):
arm-linux-gnueabihf-gcc hello.c -o hello -static
</codeblock>
<h2>用 Makefile 管理工程</h2>
<codeblock lang="makefile" title="Makefile — 最小交叉编译模板">
CROSS   = arm-linux-gnueabihf-
CC      = $(CROSS)gcc
CFLAGS  = -O2 -Wall
TARGET  = app
SRCS    = $(wildcard *.c)
OBJS    = $(SRCS:.c=.o)

$(TARGET): $(OBJS)
	$(CC) $^ -o $@ -lpthread

%.o: %.c
	$(CC) $(CFLAGS) -c $&lt; -o $@

clean:
	rm -f $(OBJS) $(TARGET)
</codeblock>
<h3>部署到板子的三种方式</h3>
<ul>
  <li><b>scp</b>：<code class="inline">scp app root@192.168.1.100:/root/</code>，日常最快；</li>
  <li><b>NFS网络文件系统</b>：开发目录挂载给板子，改完立即生效，调试利器；</li>
  <li><b>烧入镜像</b>：打包进根文件系统，量产发布用。</li>
</ul>
<div class="tip-box">💡 <b>库也必须交叉编译：</b>板子上要用 OpenSSL/JPEG库时，源码交叉编译后把 <code class="inline">.so</code> 放板子 <code class="inline">/usr/lib</code>、头文件放编译时的搜索路径。编译三板斧：<code class="inline">./configure --host=arm-linux-gnueabihf &amp;&amp; make &amp;&amp; make install DESTDIR=...</code>。</div>`,
      },
      {
        title: "Bootloader与内核启动流程",
        minutes: 14,
        content: `
<h2>U-Boot：嵌入式世界的"BIOS"</h2>
<p>U-Boot 是最主流的开源 bootloader，职责：初始化 DDR → 读取内核镜像 zImage 与设备树 dtb → 用 bootz 命令跳转内核。</p>
<codeblock lang="bash" title="U-Boot典型启动命令(串口输出节选)">
U-Boot 2020.04 (Oct 01 2025 - 10:00:00)
DRAM:  512 MiB
MMC:   FSL_SDHC: 0

# 手动引导(调试时常用):
=> tftp 80800000 zImage          # 网络下载内核(开发期神器)
=> tftp 83000000 imx6ull.dtb     # 下载设备树
=> bootz 80800000 - 83000000     # 启动!

# 自动引导环境变量:
=> setenv bootcmd 'tftp 80800000 zImage; tftp 83000000 imx6ull.dtb; bootz 80800000 - 83000000'
=> setenv bootargs 'console=ttymxc0,115200 root=/dev/nfs nfsroot=192.168.1.10:/nfs/rootfs ip=dhcp'
=> saveenv
</codeblock>
<h3>bootcmd 与 bootargs——两个最重要的环境变量</h3>
<ul>
  <li><code class="inline">bootcmd</code>：自动启动时执行什么（加载内核+设备树+bootz）；</li>
  <li><code class="inline">bootargs</code>：传给内核的参数——控制台设备、根文件系统在哪、IP怎么配；</li>
  <li>根文件系统三种常见位置：eMMC分区 <code class="inline">root=/dev/mmcblk0p2</code>、NFS <code class="inline">root=/dev/nfs</code>（开发期）、SD卡。</li>
</ul>
<h2>内核启动与 init</h2>
<codeblock lang="text" title="内核串口日志解读(精简)">
Booting Linux on physical CPU 0x0
Linux version 5.4.47 ...            ← 内核版本
CPU: ARMv7 Processor ...            ← 内核识别CPU
Memory: 512MB available             ← 内存分布
...各驱动初始化日志...
VFS: Mounted root (nfs filesystem)  ← 挂载根文件系统!
Run /sbin/init as init process      ← 移交用户空间
Welcome to Buildroot                ← init系统开始跑服务
myboard login:                      ← Shell就绪
</codeblock>
<div class="tip-box warn">⚠️ <b>调不通启动的三板斧：</b>① 串口一定先看（115200 8N1），90%的信息在这里；② 内核起不来先确认 bootargs 的 root= 是否正确——"VFS: Unable to mount root" 十有八九是这个；③ 加 <code class="inline">init=/bin/sh</code> 绕过init系统，进最小Shell排查。</div>
<h3>内核也算不清楚的时候：Kdump/打印等级</h3>
<codeblock lang="bash" title="调试小技巧">
# 串口把日志等级调高, 看更详细的内核信息
echo 8 &gt; /proc/sys/kernel/printk

# 最常见的内核崩溃: Oops
# 把 Oops 文本贴到 https://elixir.bootlin.com 配合源码定位
</codeblock>`,
      },
      {
        title: "根文件系统与BusyBox",
        minutes: 12,
        content: `
<h2>根文件系统里有什么</h2>
<codeblock lang="text" title="最小根文件系统结构">
/rootfs
├── /bin    常用命令(ls cp ...)      ← 其实都是BusyBox的符号链接
├── /sbin   系统命令(init ifconfig)
├── /lib    动态库(glibc/musl, 模块.ko)
├── /etc    配置(inittab passwd fstab profile)
├── /dev    设备文件(内核自动挂载devtmpfs)
├── /proc   内核状态虚拟文件系统(自动挂载)
├── /sys    设备树映射sysfs(自动挂载)
├── /usr    应用程序与资源
└── /root   root用户home
</codeblock>
<h2>BusyBox：一个可执行文件扮演一百个命令</h2>
<p>BusyBox 把 ls/cp/init/top 等上百个工具集成进一个约1MB的可执行文件，通过符号链接区分调用。嵌入式根文件系统的标配。</p>
<codeblock lang="bash" title="用Buildroot一条龙生成根文件系统">
# Buildroot = 内核+busybox+库+应用的自动化构建系统
make menuconfig        # 选Target(arm) / 工具链 / 包
make                   # 几小时后得到:
#   output/images/rootfs.tar   ← 解压到eMMC分区即可
#   output/images/zImage
#   output/images/*.dtb

# 空间紧张选 musl libc + busybox, 可压到 3MB 以内
</codeblock>
<h3>init 的最小配置：/etc/inittab</h3>
<codeblock lang="text" title="BusyBox init 的 inittab">
::sysinit:/etc/init.d/rcS     # 开机执行脚本
::respawn:-/bin/sh            # console上拉起shell(退出则重启)
::restart:/sbin/init
::ctrlaltdel:/sbin/reboot
</codeblock>
<div class="tip-box">💡 <b>/etc/init.d/rcS 是你的开机自启动入口</b>：让程序开机自动跑，就在里面加一行 <code class="inline">/root/app &amp;</code>（&amp;表示后台）。systemd 那套服务管理在嵌入式轻量系统上常用不到。</div>
<h2>proc 与 sys：不用写驱动也能摸到硬件</h2>
<codeblock lang="bash" title="运行时查看硬件状态">
cat /proc/cpuinfo          # CPU信息
cat /proc/meminfo          # 内存占用
cat /proc/interrupts       # 中断计数(驱动调试利器)
cat /sys/class/gpio/...    # 2.6~5.x: 用户态直接控GPIO
echo 17 &gt; /sys/class/gpio/export
echo out &gt; /sys/class/gpio/gpio17/direction
echo 1  &gt; /sys/class/gpio/gpio17/value
# 新内核推荐用 libgpiod 工具: gpioset gpiochip0 17=1
</codeblock>`,
      },
      {
        title: "设备树入门",
        minutes: 13,
        content: `
<h2>为什么需要设备树</h2>
<p>同一颗SoC焊在不同板子上，外设接法各不相同。改内核代码描述板卡太痛苦 → 社区发明了<b>设备树（Device Tree）</b>：用一份独立的数据文件描述"这块板上有什么硬件"，内核启动时读它来加载驱动。内核代码不再为板卡改动。</p>
<codeblock lang="c" title="myboard.dts — 设备树语法示例">
/dts-v1/;
/ {
    model = "My IMX6ULL Board";
    compatible = "mycompany,myboard";

    /* CPU/内存/时钟由SoC级dtsi引入, 这里只写板级差异 */

    leds {
        compatible = "gpio-leds";

        led0 {
            label = "status";
            gpios = &lt;&amp;gpio1 3 GPIO_ACTIVE_LOW&gt;;
            linux,default-trigger = "heartbeat";  /* 心跳灯 */
        };
    };

    /* 挂在I2C1总线上的温度传感器 */
    &amp;i2c1 {
        status = "okay";               /* 使能这个控制器 */

        lm75@48 {
            compatible = "national,lm75";
            reg = &lt;0x48&gt;;              /* I2C从机地址 */
            status = "okay";
        };
    };
};
</codeblock>
<h3>三个关键概念</h3>
<ul>
  <li><code class="inline">compatible</code>：设备与驱动的"身份证号"，内核驱动表按它匹配；</li>
  <li><code class="inline">status = "okay"/"disabled"</code>：外设开关，dtsi默认关闭、板级dts打开；</li>
  <li><code class="inline">reg</code>：寄存器地址/I2C地址等资源描述，<code class="inline">#address-cells</code> 决定几个32位数表示一个地址。</li>
</ul>
<codeblock lang="bash" title="编译与调试">
# 编译: dts → dtb
make dtbs                          # 内核树内
dtc -I dts -O dtb -o myboard.dtb myboard.dts   # 独立dtc工具

# 反编译检查(改完必做):
dtc -I dtb -O dts myboard.dtb | less

# 板子上确认设备树生效:
ls /proc/device-tree/              # 已加载的设备树
cat /proc/device-tree/model
</codeblock>
<div class="tip-box warn">⚠️ <b>写驱动的第一课就是设备树</b>：平台设备驱动 probe 函数被调用的前提，是设备树里有 compatible 匹配的节点且 status="okay"。设备不 probe，先 <code class="inline">ls /sys/bus/platform/devices/</code> 查节点在不在，再查 compatible 字符串一字不差。</div>
<h2>一张图总结嵌入式Linux知识版图</h2>
<codeblock lang="text" title="学习检查表">
☑ Linux常用命令与Shell脚本
☑ 交叉编译 + Makefile/CMake
☑ Bootloader概念 + U-Boot环境变量
☑ 内核启动流程 + bootargs
☑ Buildroot/BusyBox 构建根文件系统
☑ 设备树语法 + dtc调试
→ 进阶: 内核模块 / 字符设备驱动 / 平台总线 / 中断与工作队列
→ 应用: Qt界面 / MQTT联网 / 视频采集(V4L2)
</codeblock>`,
      },
    ],
  },
];

/* ==================== 自测题库 ==================== */
const QUIZ_QUESTIONS = [
  {
    course: "c-basics",
    q: "在32位MCU上，以下哪种写法将第5位置1且不影响其他位？",
    options: [
      "reg = 0x20;",
      "reg |= (1u << 5);",
      "reg &= (1u << 5);",
      "reg ^= 0x20;",
    ],
    answer: 1,
    explain: "「读-改-写」中，|= 只把目标位置1、其他位保持不变；A会清掉其他位；C是『只保留第5位、其他全清』；D是翻转第5位。",
  },
  {
    course: "c-basics",
    q: "主循环和中断服务程序共享一个标志变量，为什么必须加 volatile？",
    options: [
      "让它存到Flash里更安全",
      "保证对该变量的操作是原子的",
      "防止编译器优化掉对它的重复读取",
      "让变量分配到栈上",
    ],
    answer: 2,
    explain: "volatile 禁止编译器把变量缓存到寄存器、保证每次都真实读写内存。注意它不保证原子性——原子性需要关中断或使用原子操作。",
  },
  {
    course: "c-basics",
    q: "struct { uint8_t a; uint32_t b; uint8_t c; } 在32位ARM上 sizeof 默认是多少？",
    options: ["6", "8", "10", "12"],
    answer: 3,
    explain: "a后填充3字节、c后填充3字节：1+3+4+1+3=12。把uint32_t放最前可省到8字节；packed可压到6字节但访问变慢。",
  },
  {
    course: "c-basics",
    q: "想把一个256字节的查找表存进Flash而不占RAM，应使用：",
    options: [
      "static uint8_t table[256];",
      "const uint8_t table[256] = {...};",
      "volatile uint8_t table[256];",
      "放在函数里定义",
    ],
    answer: 1,
    explain: "带初始化值的const全局数组进入.rodata段（Flash）。static无const仍会占RAM（.data/.bss段）。",
  },
  {
    course: "mcu51",
    q: "51单片机串口常用晶振 11.0592MHz 而不是 12MHz，原因是：",
    options: [
      "11.0592MHz 更省电",
      "能被波特率发生器整除出标准波特率、零误差",
      "12MHz 晶振容易起振失败",
      "51内核最大只支持11MHz",
    ],
    answer: 1,
    explain: "9600 × 1152 = 11059200，整数分频后波特率无累积误差。用12MHz时波特率有小偏差，长通信可能出错。",
  },
  {
    course: "mcu51",
    q: "51单片机定时器0模式1（16位）在12MHz下定时1ms，初值应为：",
    options: ["65536 - 1000", "1000", "50000", "65535"],
    answer: 0,
    explain: "12MHz经12分频后机器周期1μs，16位计数器从初值加到65536溢出，故初值=65536-1000=64536，TH0=0xFC、TL0=0x18。",
  },
  {
    course: "mcu51",
    q: "关于按键软件消抖，正确的做法是：",
    options: [
      "在中断里直接 delay(10ms) 消抖",
      "检测到低电平后延时约10ms再确认一次",
      "把按键接到P0口就不需要消抖",
      "用 while(1) 循环等待松手即可",
    ],
    answer: 1,
    explain: "机械触点抖动约5~10ms。二次确认（或定时器状态机扫描）是标准做法；中断里长时间延时是反模式。",
  },
  {
    course: "stm32",
    q: "STM32 上 printf 输出乱码/卡死，最可能的原因不包括：",
    options: [
      "Keil 没勾选 Use MicroLIB",
      "波特率与串口助手设置不一致",
      "系统时钟配置与CubeMX不符",
      "变量定义时没加 volatile",
    ],
    answer: 3,
    explain: "volatile 影响的是变量优化，与printf输出无关。其他三项都是printf问题的经典原因。",
  },
  {
    course: "stm32",
    q: "72MHz定时器时钟，PSC=71、ARR=999，PWM输出频率是：",
    options: ["1kHz", "10kHz", "72kHz", "100Hz"],
    answer: 0,
    explain: "72MHz / (71+1) / (999+1) = 72M/72/1000 = 1kHz。占空比由CCR/(ARR+1)决定。",
  },
  {
    course: "stm32",
    q: "使用 HAL 库访问 I2C 器件时，7位地址 0x3C 应传入：",
    options: ["0x3C", "0x3C << 1 = 0x78", "0x1E", "0x3C >> 1"],
    answer: 1,
    explain: "HAL的地址参数包含读/写位（第0位），所以7位地址要左移1位。忘了左移是I2C调试第一大坑。",
  },
  {
    course: "stm32",
    q: "需要连续采集4路传感器且尽量少占CPU，最合适的方案是：",
    options: [
      "主循环里轮询4个通道逐个读取",
      "每个通道开一个定时器中断读取",
      "ADC扫描模式 + DMA循环传输到内存数组",
      "用软件延时分时复用一个通道",
    ],
    answer: 2,
    explain: "扫描+DMA由硬件自动完成通道切换和数据搬运，CPU零占用，主循环直接读数组即可。",
  },
  {
    course: "rtos",
    q: "FreeRTOS 中「实时」的确切含义是：",
    options: [
      "运行速度非常快",
      "响应时间有确定上界，最坏情况可预测",
      "系统时钟精确到微秒",
      "使用硬件定时器而不是软件延时",
    ],
    answer: 1,
    explain: "实时=按时（时间确定性），不是快。抢占式调度保证高优先级事件的最坏响应时间可计算。",
  },
  {
    course: "rtos",
    q: "低优先级任务持锁、高优先级任务等锁、中优先级任务插队运行——这种现象叫：",
    options: ["死锁", "优先级反转", "活锁", "饥饿"],
    answer: 1,
    explain: "优先级反转（Priority Inversion）。互斥锁的优先级继承机制专门解决此问题——这也是『保护共享资源要用Mutex而非二值信号量』的原因。",
  },
  {
    course: "rtos",
    q: "任务间传递传感器数据（结构体），最推荐的方式是：",
    options: [
      "全局变量 + volatile",
      "全局变量 + 临界区包住每次读写",
      "队列 xQueueSend/Receive 值拷贝传递",
      "都写在同一个任务里",
    ],
    answer: 2,
    explain: "队列自带线程安全与阻塞机制，是FreeRTOS官方推荐的通信原语。全局变量方案容易漏保护、不可扩展。",
  },
  {
    course: "rtos",
    q: "任务栈溢出的典型症状是：",
    options: [
      "编译时栈大小报错",
      "串口输出乱码",
      "运行一段时间后随机死机/硬fault",
      "任务无法创建，返回错误码",
    ],
    answer: 2,
    explain: "栈溢出破坏相邻内存，表现为『莫名』随机崩溃。开启configCHECK_FOR_STACK_OVERFLOW=2并用uxTaskGetStackHighWaterMark检查水位。",
  },
  {
    course: "embedded-linux",
    q: "在x86的Ubuntu上为ARM板编译程序，使用的工具链是：",
    options: [
      "gcc",
      "arm-linux-gnueabihf-gcc",
      "g++",
      "clang",
    ],
    answer: 1,
    explain: "交叉编译器生成另一种架构的可执行文件。用gcc编译出来的x86程序在ARM板上无法运行。",
  },
  {
    course: "embedded-linux",
    q: "内核报「VFS: Unable to mount root」，最应优先检查：",
    options: [
      "串口波特率",
      "bootargs 中 root= 参数指向的根文件系统是否正确",
      "网线是否插好",
      "内核版本号",
    ],
    answer: 1,
    explain: "该错误表示内核找不到或挂不上根文件系统。root=/dev/mmcblk0p2、root=/dev/nfs等参数错误是头号原因。",
  },
  {
    course: "embedded-linux",
    q: "设备树中，驱动 probe 函数被调用的前提是：",
    options: [
      "内核编译时开启了所有驱动",
      "设备树节点 compatible 与驱动匹配，且 status = \"okay\"",
      "dts 文件被加密",
      "板子重启两次",
    ],
    answer: 1,
    explain: "设备树负责描述硬件、驱动通过compatible匹配设备。节点被status=\"disabled\"禁用或不匹配时，probe不会执行。",
  },
];
