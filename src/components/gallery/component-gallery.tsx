"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BackButton } from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { BannerHeader } from "@/components/ui/banner-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible } from "@/components/ui/collapsible";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { createDataTableColumnHelper, DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DateTimeYear } from "@/components/ui/date-time-year";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormGallery } from "@/components/ui/form-gallery";
import { Hierarchy, type TreeNode } from "@/components/ui/hierarchy";
import { HoverCard, HoverCardContent, HoverCardLink, HoverCardTrigger } from "@/components/ui/hover-card";
import { IconButton } from "@/components/ui/icon-button";
import { IconListItem } from "@/components/ui/icon-list-item";
import { Input } from "@/components/ui/input";
import { InputField } from "@/components/ui/input-field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { KebabMenu } from "@/components/ui/kebab-menu";
import { Loading } from "@/components/ui/loading";
import { LogoLinkCard } from "@/components/ui/logo-link-card";
import { NavLink } from "@/components/ui/nav-link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { PageScrollArea } from "@/components/ui/page-scroll-area";
import { PasswordInputField } from "@/components/ui/password-input-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PopupMessageProvider, usePopupMessage } from "@/components/ui/popup-message";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RadioButton } from "@/components/ui/radio-button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ReferenceChip, type ReferenceMap } from "@/components/ui/reference-chip";
import { Crunch, CrunchReplace, DisappearReplace, Stream } from "@/components/ui/scramble-typing";
import { SmoothReplace } from "@/components/ui/scramble-wrappers";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ScrollableCard } from "@/components/ui/scrollable-card";
import { SearchBar } from "@/components/ui/search-bar";
import { SearchCard } from "@/components/ui/search-card";
import { SectionConstructIn } from "@/components/ui/section-construct-in";
import { SectionFadeIn } from "@/components/ui/section-fade-in";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SlideSelector } from "@/components/ui/slide-selector";
import { Slider } from "@/components/ui/slider";
import { SliderRange } from "@/components/ui/slider-range";
import { SocialLinks } from "@/components/ui/social-link";
import { Spinner } from "@/components/ui/spinner";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagInput } from "@/components/ui/tag-input";
import { TagSelect, type TagSelectOption } from "@/components/ui/tag-select";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WidgetCard, WidgetCardFallback } from "@/components/ui/widget-card";
import { YearPicker } from "@/components/ui/year-picker";
import { YouTubeEmbed } from "@/components/ui/youtube-embed";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Sample data (module scope so tables/lists keep stable references). */
/* ------------------------------------------------------------------ */

// Fixed date so server and client render the same markup.
const SAMPLE_DATE = new Date(2026, 0, 15, 9, 30);

type Person = { name: string; role: string; city: string; score: number };

const PEOPLE: Person[] = [
  { name: "Ada Park", role: "Engineer", city: "Lisbon", score: 92 },
  { name: "Ben Ortiz", role: "Designer", city: "Toronto", score: 78 },
  { name: "Chloe Ng", role: "Product", city: "Singapore", score: 85 },
  { name: "Dev Rao", role: "Engineer", city: "Berlin", score: 64 },
  { name: "Eli Moss", role: "Support", city: "Austin", score: 71 },
];

const personColumns = createDataTableColumnHelper<Person>();
const PEOPLE_COLUMNS = [
  personColumns.accessor("name", { header: "Name" }),
  personColumns.accessor("role", { header: "Role" }),
  personColumns.accessor("city", { header: "City" }),
  personColumns.accessor("score", { header: "Score" }),
];

const TREE: TreeNode[] = [
  {
    id: "src",
    label: "src",
    defaultExpanded: true,
    icon: <Icon icon="mdi:folder-outline" className="size-4" />,
    children: [
      {
        id: "app",
        label: "app",
        icon: <Icon icon="mdi:folder-outline" className="size-4" />,
        children: [{ id: "page", label: "page.tsx" }],
      },
      { id: "utils", label: "utils.ts" },
    ],
  },
  { id: "readme", label: "README.md" },
];

const REFS = {
  knuth74: {
    id: "knuth74",
    authors: "Knuth, D. E.",
    year: "1974",
    title: "Structured Programming with go to Statements",
    source: "Computing Surveys",
    note: "Origin of the premature-optimization quote.",
    href: "https://doi.org/10.1145/356635.356640",
  },
} satisfies ReferenceMap;

const TAG_OPTIONS: TagSelectOption[] = [
  { value: "react", label: "React", icon: "simple-icons:react" },
  { value: "next", label: "Next.js", icon: "simple-icons:nextdotjs" },
  { value: "tailwind", label: "Tailwind", icon: "simple-icons:tailwindcss" },
  { value: "supabase", label: "Supabase", icon: "simple-icons:supabase" },
];

const FRUITS = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape", "Honeydew", "Kiwi", "Lemon"];

/* ------------------------------------------------------------------ */
/* Layout helpers                                                      */
/* ------------------------------------------------------------------ */

const GALLERY_SECTIONS = [
  { id: "actions", title: "Actions" },
  { id: "forms", title: "Forms" },
  { id: "overlays", title: "Overlays" },
  { id: "data-display", title: "Data display" },
  { id: "navigation", title: "Navigation" },
  { id: "layout", title: "Layout" },
  { id: "motion", title: "Motion" },
] as const;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <h2 className="border-b border-border pb-2 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Demo({ name, children, wide, className }: { name: string; children: React.ReactNode; wide?: boolean; className?: string }) {
  return (
    <Card className={cn("min-w-0", wide && "md:col-span-2")}>
      <CardHeader>
        <CardTitle className="font-mono text-xs font-medium text-muted-foreground">{name}</CardTitle>
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-3 px-4 py-4", className)}>{children}</CardContent>
    </Card>
  );
}

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function ActionsSection() {
  const [loading, setLoading] = React.useState(false);

  return (
    <Section id="actions" title="Actions">
      <Demo name="button" wide>
        <Row>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await wait(1500);
              setLoading(false);
            }}
          >
            Click to load
          </Button>
          <Button variant="secondary">
            <Icon icon="lucide:download" className="size-4" aria-hidden="true" />
            With icon
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            buttonVariants on a Link
          </Link>
        </Row>
      </Demo>

      <Demo name="icon-button">
        <Row>
          <IconButton aria-label="Small" icon="lucide:plus" size="sm" />
          <IconButton aria-label="Medium" icon="lucide:pencil" />
          <IconButton aria-label="Large" icon="lucide:trash-2" size="lg" variant="destructive" />
          <IconButton aria-label="Settings" icon="lucide:settings" variant="secondary" />
        </Row>
      </Demo>

      <Demo name="button-group">
        <ButtonGroup>
          <Button variant="outline">Day</Button>
          <Button variant="outline">Week</Button>
          <Button variant="outline">Month</Button>
        </ButtonGroup>
        <ButtonGroup>
          <ButtonGroupText>Qty</ButtonGroupText>
          <Button variant="secondary">-</Button>
          <ButtonGroupSeparator />
          <Button variant="secondary">+</Button>
        </ButtonGroup>
      </Demo>

      <Demo name="back-button">
        <Row>
          <BackButton />
          <BackButton href="/dashboard">To dashboard</BackButton>
        </Row>
      </Demo>

      <Demo name="submit-button">
        <form
          action={async () => {
            await wait(1500);
          }}
          className="flex items-center gap-2"
        >
          <Input name="demo" placeholder="Submit me" className="max-w-48" />
          <SubmitButton>Save</SubmitButton>
        </form>
      </Demo>

      <Demo name="kebab-menu">
        <Row>
          <span className="text-sm text-muted-foreground">Item actions</span>
          <KebabMenu
            items={[
              { label: "Copy link", icon: "lucide:link", onSelect: () => "Link copied" },
              { label: "Share", icon: "lucide:share", onSelect: () => "Shared" },
              { label: "Archive", icon: "lucide:archive", onSelect: () => undefined },
            ]}
          />
        </Row>
      </Demo>
    </Section>
  );
}

function FormsSection() {
  const [text, setText] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [checked, setChecked] = React.useState(true);
  const [radio, setRadio] = React.useState("comfortable");
  const [select, setSelect] = React.useState("");
  const [fruit, setFruit] = React.useState("apple");
  const [slider, setSlider] = React.useState(40);
  const [range, setRange] = React.useState<[number, number]>([20, 80]);
  const [tags, setTags] = React.useState<string[]>(["design", "frontend"]);
  const [picked, setPicked] = React.useState<string[]>(["next"]);
  const [phone, setPhone] = React.useState("");
  const [day, setDay] = React.useState<Date | undefined>(SAMPLE_DATE);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [year, setYear] = React.useState<number | undefined>(undefined);
  const [size, setSize] = React.useState("m");

  return (
    <Section id="forms" title="Forms">
      <Demo name="input / textarea">
        <Input placeholder="Plain input" value={text} onChange={(e) => setText(e.target.value)} />
        <Input placeholder="Disabled" disabled />
        <Textarea placeholder="Textarea" />
      </Demo>

      <Demo name="input-field / password-input-field / search-bar">
        <InputField leftIcon="mdi:email-outline" placeholder="Email" type="email" />
        <PasswordInputField placeholder="Password" autoComplete="off" />
        <SearchBar placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Demo>

      <Demo name="input-group">
        <InputGroup>
          <InputGroupAddon>
            <Icon icon="lucide:globe" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="secondary">Go</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput placeholder="Amount" inputMode="decimal" />
          <InputGroupAddon align="inline-end">USD</InputGroupAddon>
        </InputGroup>
      </Demo>

      <Demo name="checkbox / radio-group">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
          Email me updates
        </label>
        <RadioGroup value={radio} onValueChange={setRadio}>
          {["default", "comfortable", "compact"].map((v) => (
            <label key={v} htmlFor={`density-${v}`} className="flex items-center gap-2 text-sm capitalize">
              <RadioGroupItem id={`density-${v}`} value={v} />
              {v}
            </label>
          ))}
        </RadioGroup>
      </Demo>

      <Demo name="radio-button">
        <RadioButton name="plan" value="free" label="Free — for side projects" defaultChecked />
        <RadioButton name="plan" value="pro" label="Pro — for teams" />
        <RadioButton name="plan" value="ent" label="Enterprise (disabled)" disabled />
      </Demo>

      <Demo name="select">
        <Select value={select} onValueChange={setSelect} placeholder="Any status">
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </Select>
        <SelectRoot value={fruit} onValueChange={setFruit}>
          <SelectTrigger>
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruit</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="pear">Pear</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Berries</SelectLabel>
              <SelectItem value="blueberry">Blueberry</SelectItem>
            </SelectGroup>
          </SelectContent>
        </SelectRoot>
      </Demo>

      <Demo name="slider / slider-range">
        <div className="text-xs text-muted-foreground">Value: {slider}</div>
        <Slider value={slider} onChange={setSlider} aria-label="Volume" />
        <div className="text-xs text-muted-foreground">
          Range: {range[0]}–{range[1]}
        </div>
        <SliderRange value={range} onChange={setRange} aria-label="Price range" />
      </Demo>

      <Demo name="tag-input / tag-select">
        <TagInput value={tags} onChange={setTags} placeholder="Add a tag and press Enter" />
        <TagSelect options={TAG_OPTIONS} value={picked} onChange={setPicked} />
      </Demo>

      <Demo name="phone-input">
        <PhoneInput value={phone} onValueChange={setPhone} defaultCountryIso2="US" />
        <span className="text-xs text-muted-foreground">Value: {phone || "—"}</span>
      </Demo>

      <Demo name="slide-selector">
        <SlideSelector
          aria-label="Size"
          items={[
            { value: "s", label: "Small" },
            { value: "m", label: "Medium" },
            { value: "l", label: "Large" },
          ]}
          selectedValue={size}
          onSelect={setSize}
        />
        <SlideSelector
          aria-label="Number"
          variant="square"
          items={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: n }))}
          selectedValue="3"
          onSelect={() => undefined}
        />
      </Demo>

      <Demo name="calendar">
        <Calendar mode="single" selected={day} onSelect={setDay} defaultMonth={SAMPLE_DATE} />
      </Demo>

      <Demo name="date-picker / date-time-picker / date-time-year / year-picker">
        <DatePicker value={date} onChange={setDate} />
        <DateTimePicker defaultValue={SAMPLE_DATE} />
        <DateTimeYear defaultValue={SAMPLE_DATE} />
        <YearPicker value={year} onChange={setYear} />
      </Demo>

      <Demo name="form-gallery" wide>
        <div className="h-56">
          <FormGallery
            slides={[
              { title: "Name", content: <Input placeholder="Your name" /> },
              { title: "Email", content: <InputField leftIcon="mdi:email-outline" placeholder="you@example.com" /> },
              { title: "Done", content: <p className="text-sm text-muted-foreground">All set — press finish.</p> },
            ]}
            onFinish={() => undefined}
          />
        </div>
      </Demo>
    </Section>
  );
}

function PopupDemo() {
  const { showPopup } = usePopupMessage();
  return (
    <Row>
      <Button variant="secondary" onClick={() => showPopup("Saved")}>
        Show popup
      </Button>
      <Button
        variant="outline"
        onClick={() => showPopup("Your changes were published.", { title: "Published", position: "bottom-right" })}
      >
        Bottom-right with title
      </Button>
    </Row>
  );
}

function OverlaysSection() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(true);
  const [sort, setSort] = React.useState("newest");

  return (
    <Section id="overlays" title="Overlays">
      <Demo name="dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Near full-screen, scrolls with SimpleBar when content overflows.</DialogDescription>
            </DialogHeader>
            <p className="text-sm">Hover the dialog to reveal the close badge, or press Escape.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Confirm</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Demo>

      <Demo name="tooltip">
        <Row>
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <Tooltip key={side}>
              <TooltipTrigger asChild>
                <Button variant="outline">{side}</Button>
              </TooltipTrigger>
              <TooltipContent side={side}>Tooltip on {side}</TooltipContent>
            </Tooltip>
          ))}
        </Row>
      </Demo>

      <Demo name="popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="self-start">
              Open popover
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-2">
            <p className="font-medium">Dimensions</p>
            <Input placeholder="Width" />
            <Input placeholder="Height" />
          </PopoverContent>
        </Popover>
      </Demo>

      <Demo name="hover-card / reference-chip">
        <p className="text-sm">
          Hover{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a href="#overlays" className="text-primary underline-offset-4 hover:underline">
                @nextjs
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="space-y-2">
              <p className="font-medium">Next.js</p>
              <p className="text-xs text-muted-foreground">The React framework.</p>
              <HoverCardLink href="https://nextjs.org">nextjs.org</HoverCardLink>
            </HoverCardContent>
          </HoverCard>{" "}
          for a preview card.
        </p>
        <p className="text-sm">
          Premature optimization is the root of all evil <ReferenceChip refs={REFS} id="knuth74" />.
        </p>
      </Demo>

      <Demo name="dropdown-menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="self-start">
              Options
              <Icon icon="lucide:chevron-down" className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuItem>
              Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={(v) => setShowGrid(v === true)}>
              Show grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="newest">Newest</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Export</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </Demo>

      <Demo name="context-menu">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-28 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuItem>
              Back <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Reload</ContextMenuItem>
            <ContextMenuCheckboxItem checked>Show bookmarks</ContextMenuCheckboxItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>More tools</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Developer tools</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Demo>

      <Demo name="command">
        <Command className="rounded-md">
          <CommandInput placeholder="Type a command…" />
          <CommandList scrollClassName="max-h-40">
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>
                <Icon icon="lucide:calendar" className="size-4" aria-hidden="true" />
                Calendar
              </CommandItem>
              <CommandItem>
                <Icon icon="lucide:calculator" className="size-4" aria-hidden="true" />
                Calculator
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>
                Profile <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <Button variant="outline" className="self-start" onClick={() => setCommandOpen(true)}>
          Open command dialog
        </Button>
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Pages">
              {GALLERY_SECTIONS.map((s) => (
                <CommandItem key={s.id} onSelect={() => setCommandOpen(false)}>
                  {s.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </Demo>

      <Demo name="popup-message">
        <PopupDemo />
      </Demo>
    </Section>
  );
}

function DataDisplaySection() {
  const [badges, setBadges] = React.useState(["alpha", "beta", "gamma"]);
  const [widgetVisible, setWidgetVisible] = React.useState(true);

  return (
    <Section id="data-display" title="Data display">
      <Demo name="badge">
        <Row>
          <Badge>Static</Badge>
          {badges.map((b) => (
            <Badge key={b} onRemove={() => setBadges((cur) => cur.filter((x) => x !== b))} removeLabel={`Remove ${b}`}>
              {b}
            </Badge>
          ))}
          {badges.length < 3 ? (
            <Button variant="link" className="px-0" onClick={() => setBadges(["alpha", "beta", "gamma"])}>
              Reset
            </Button>
          ) : null}
        </Row>
      </Demo>

      <Demo name="card">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>Body content goes here.</CardContent>
          <CardFooter>
            <Button variant="secondary">Action</Button>
          </CardFooter>
        </Card>
      </Demo>

      <Demo name="table">
        <Table>
          <TableCaption>Plain table primitives.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PEOPLE.slice(0, 3).map((p) => (
              <TableRow key={p.name}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Demo>

      <Demo name="data-table (sortable + selectable)">
        <DataTable columns={PEOPLE_COLUMNS} data={PEOPLE} selectable />
      </Demo>

      <Demo name="progress-bar">
        <ProgressBar label="Storage" value={64} max={100} delta="+12%" />
        <ProgressBar label="Quota" value={30} max={120} delta="-3" showHandle />
      </Demo>

      <Demo name="hierarchy">
        <Hierarchy nodes={TREE} selectedId="utils" />
      </Demo>

      <Demo name="icon-list-item">
        <ul className="space-y-2 text-sm">
          <IconListItem icon="lucide:check">Server-rendered by default</IconListItem>
          <IconListItem icon="lucide:check">Accessible primitives</IconListItem>
          <IconListItem icon="lucide:x" iconClassName="text-destructive">
            No vendor lock-in
          </IconListItem>
        </ul>
      </Demo>

      <Demo name="logo-link-card">
        <LogoLinkCard
          href="https://nextjs.org"
          logo={<Icon icon="simple-icons:nextdotjs" className="size-5" aria-hidden="true" />}
          title="Next.js"
          subtitle="Framework"
          description="The whole card is the link; the badge lifts on hover."
        />
      </Demo>

      <Demo name="spinner / loading">
        <Row>
          <Spinner />
          <Spinner className="size-6 text-primary" />
          <Spinner icon="lucide:loader" className="size-8" />
        </Row>
        <Loading containerClassName="min-h-24" />
      </Demo>

      <Demo name="widget-card">
        <div className="grid h-40 grid-cols-2 gap-3">
          {widgetVisible ? (
            <WidgetCard title="Revenue" onRemove={() => setWidgetVisible(false)}>
              <p className="text-2xl font-semibold">$12.4k</p>
            </WidgetCard>
          ) : (
            <Button variant="secondary" onClick={() => setWidgetVisible(true)}>
              Restore widget
            </Button>
          )}
          <WidgetCardFallback />
        </div>
      </Demo>

      <Demo name="youtube-embed" wide>
        <YouTubeEmbed url="https://www.youtube.com/watch?v=aqz-KE-bpKQ" privacyEnhanced loading="lazy" className="max-w-xl" />
      </Demo>
    </Section>
  );
}

function NavigationSection() {
  const [open, setOpen] = React.useState(false);

  const menuItems = (
    <>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Products</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-64 gap-1 p-2">
            {["Analytics", "Automation", "Reports"].map((item) => (
              <li key={item}>
                <NavigationMenuLink asChild>
                  <Link href="#navigation" className="block rounded-sm px-3 py-2 text-sm hover:bg-accent">
                    {item}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="w-80 space-y-1 p-3 text-sm">
            <p className="font-medium">Docs</p>
            <p className="text-muted-foreground">Guides, API reference and examples.</p>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
          <Link href="#navigation">Pricing</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    </>
  );

  return (
    <Section id="navigation" title="Navigation">
      <Demo name="navigation-menu (in place, default)" className="min-h-48">
        <div className="flex">
          <NavigationMenu>
            <NavigationMenuList>{menuItems}</NavigationMenuList>
          </NavigationMenu>
        </div>
      </Demo>

      <Demo name="navigation-menu (viewport + indicator)" className="min-h-48">
        <div className="flex">
          <NavigationMenu viewport>
            <NavigationMenuList>
              {menuItems}
              <NavigationMenuIndicator />
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </Demo>

      <Demo name="navigation-menu (openUpwards)" className="min-h-48 justify-end">
        <div className="flex">
          <NavigationMenu openUpwards>
            <NavigationMenuList>{menuItems}</NavigationMenuList>
          </NavigationMenu>
        </div>
      </Demo>

      <Demo name="nav-link">
        <Row className="gap-4 text-sm">
          <NavLink href="/components">Components (current)</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/account">Account</NavLink>
        </Row>
      </Demo>

      <Demo name="tabs (horizontal)">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-2 text-sm">
            Overview panel.
          </TabsContent>
          <TabsContent value="activity" className="pt-2 text-sm">
            Activity panel.
          </TabsContent>
          <TabsContent value="settings" className="pt-2 text-sm">
            Settings panel.
          </TabsContent>
        </Tabs>
      </Demo>

      <Demo name="tabs (vertical)">
        <Tabs defaultValue="general" orientation="vertical" className="flex gap-4">
          <TabsList>
            <TabsTrigger value="general">
              <Icon icon="lucide:settings" className="size-4" aria-hidden="true" />
              General
            </TabsTrigger>
            <TabsTrigger value="security">
              <Icon icon="lucide:shield" className="size-4" aria-hidden="true" />
              Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="text-sm">
            General settings.
          </TabsContent>
          <TabsContent value="security" className="text-sm">
            Security settings.
          </TabsContent>
        </Tabs>
      </Demo>

      <Demo name="accordion">
        <Accordion type="single" collapsible defaultValue="a">
          <AccordionItem value="a">
            <AccordionTrigger icon="mdi:compass-outline">What is this?</AccordionTrigger>
            <AccordionContent>A gallery of every component in the UI library.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Can I remove it?</AccordionTrigger>
            <AccordionContent>Yes — delete the page and its sidebar link.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Demo>

      <Demo name="collapsible">
        <Collapsible label="Show details" open={open} onOpenChange={setOpen}>
          <p className="py-2 text-sm text-muted-foreground">Measured height animation; works controlled or uncontrolled.</p>
        </Collapsible>
      </Demo>

      <Demo name="social-link">
        <SocialLinks
          links={[
            { label: "GitHub", href: "https://github.com", icon: "simple-icons:github" },
            { label: "LinkedIn", href: "https://linkedin.com", icon: "simple-icons:linkedin" },
            { label: "Email", href: "mailto:hello@example.com", icon: "lucide:mail" },
          ]}
        />
        <SocialLinks showLabel links={[{ label: "GitHub", href: "https://github.com", icon: "simple-icons:github" }]} />
      </Demo>
    </Section>
  );
}

function LayoutSection() {
  const [query, setQuery] = React.useState("");
  const filtered = FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase()));

  return (
    <Section id="layout" title="Layout">
      <Demo name="section-header / banner-header" wide>
        <SectionHeader as="h3">Section header</SectionHeader>
        <BannerHeader>Banner header</BannerHeader>
      </Demo>

      <Demo name="separator">
        <p className="text-sm">Above</p>
        <Separator />
        <div className="flex h-5 items-center gap-3 text-sm">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </Demo>

      <Demo name="scroll-area">
        <ScrollArea className="h-32 rounded-md border border-border">
          <ul className="p-3 text-sm">
            {FRUITS.map((f) => (
              <li key={f} className="py-1">
                {f}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <ScrollArea className="w-full rounded-md border border-border">
          <div className="flex w-max gap-2 p-3">
            {FRUITS.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Demo>

      <Demo name="scrollable-card">
        <div className="h-48">
          <ScrollableCard header="Notifications" headerActions={<Badge>{FRUITS.length}</Badge>}>
            {FRUITS.map((f) => (
              <p key={f}>{f} is in stock.</p>
            ))}
          </ScrollableCard>
        </div>
      </Demo>

      <Demo name="search-card">
        <div className="h-48">
          <SearchCard
            header="Fruit"
            searchValue={query}
            onSearchChange={(e) => setQuery(e.target.value)}
            searchPlaceholder="Filter…"
          >
            {filtered.length ? filtered.map((f) => <p key={f}>{f}</p>) : <p className="text-muted-foreground">No match.</p>}
          </SearchCard>
        </div>
      </Demo>

      <Demo name="page-scroll-area (bounded here; full-height by default)">
        <PageScrollArea className="h-48 rounded-md border border-border">
          <div className="space-y-2 p-3 text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <p key={i}>Page content line {i + 1}</p>
            ))}
          </div>
          <footer className="mt-auto border-t border-border p-3 text-xs text-muted-foreground">Footer sits at the bottom</footer>
        </PageScrollArea>
      </Demo>
    </Section>
  );
}

function MotionSection() {
  const [streamKey, setStreamKey] = React.useState(0);

  return (
    <Section id="motion" title="Motion">
      <Demo name="section-fade-in">
        <SectionFadeIn>
          <p className="text-sm">Fades and rises into view when scrolled to.</p>
        </SectionFadeIn>
      </Demo>

      <Demo name="section-construct-in">
        <SectionConstructIn strokeClassName="stroke-primary">
          <p className="p-4 text-sm">The border draws itself, then the text decodes.</p>
        </SectionConstructIn>
      </Demo>

      <Demo name="scramble-typing: DisappearReplace / CrunchReplace">
        <DisappearReplace messages={["Ship <faster>", "Build <better>", "Sleep <more>"]} averageDelayMs={1500} />
        <CrunchReplace messages={["Hello", "Bonjour", "Hola"]} averageDelayMs={1500} />
      </Demo>

      <Demo name="scramble-wrappers: SmoothReplace (with noscript fallback)">
        <SmoothReplace messages={["Reusable components", "Consistent tokens", "Accessible defaults"]} averageDelayMs={2500} />
      </Demo>

      <Demo name="scramble-typing: Stream">
        <Stream key={streamKey} text="Streaming text, one scrambled character at a time." scrambleSpeed={40} delay={0} />
        <Button variant="secondary" className="self-start" onClick={() => setStreamKey((k) => k + 1)}>
          Replay
        </Button>
      </Demo>

      <Demo name="scramble-typing: Crunch">
        <div className="h-12 overflow-hidden font-mono text-sm">
          <Crunch />
        </div>
      </Demo>
    </Section>
  );
}

/** Every component in src/components/ui, grouped by purpose, for eyeballing the library. */
export function ComponentGallery() {
  return (
    <TooltipProvider delayDuration={200}>
      <PopupMessageProvider>
        <div className="flex flex-col gap-12">
          <ActionsSection />
          <FormsSection />
          <OverlaysSection />
          <DataDisplaySection />
          <NavigationSection />
          <LayoutSection />
          <MotionSection />
        </div>
      </PopupMessageProvider>
    </TooltipProvider>
  );
}
