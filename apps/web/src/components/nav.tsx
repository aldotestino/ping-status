import { Link, useLocation } from "@tanstack/react-router";
import { ChartSpline, HouseIcon } from "lucide-react";
import BurgerMenuIcon from "@/components/burger-menu-icon";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const navigationLinks = [
  { to: "/", label: "Status", icon: HouseIcon },
  { to: "/monitors", label: "Monitors", icon: ChartSpline },
];

export function Nav() {
  const location = useLocation({
    select: ({ pathname }) => pathname,
  });

  return (
    <header className="mx-auto max-w-screen-lg px-4 md:px-6">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-2">
          {/* Mobile menu trigger */}
          <MobileMenu location={location} />
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="whitespace-nowrap font-semibold text-xl">
              Ping Status
            </h1>
          </div>
        </div>
        {/* Middle area */}
        <NavigationMenu className="max-md:hidden">
          <NavigationMenuList className="gap-2">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink
                    active={location === link.to}
                    asChild
                    className="flex-row items-center gap-2 py-1.5 font-medium text-foreground hover:text-primary"
                  >
                    <Link to={link.to}>
                      <Icon
                        aria-hidden="true"
                        className="text-muted-foreground/80"
                        size={16}
                      />
                      <span>{link.label}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ location }: { location: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="group size-8 md:hidden" size="icon" variant="ghost">
          <BurgerMenuIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-36 p-1 md:hidden">
        <NavigationMenu className="max-w-none *:w-full">
          <NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavigationMenuItem className="w-full" key={link.label}>
                  <NavigationMenuLink
                    active={location === link.to}
                    asChild
                    className="flex-row items-center gap-2 py-1.5"
                  >
                    <Link to={link.to}>
                      <Icon
                        aria-hidden="true"
                        className="text-muted-foreground/80"
                        size={16}
                      />
                      <span>{link.label}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </PopoverContent>
    </Popover>
  );
}

export default Nav;
