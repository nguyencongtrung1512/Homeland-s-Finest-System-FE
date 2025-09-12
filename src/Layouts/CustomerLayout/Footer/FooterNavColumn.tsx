import React from 'react';

interface FooterNavItem {
  label: string;
  href?: string;
}

interface FooterNavColumnProps {
  title: string;
  items: FooterNavItem[];
}

const FooterNavColumn: React.FC<FooterNavColumnProps> = ({ title, items }) => {
  return (
    <nav className="flex flex-col grow w-full bg-lime-900 bg-opacity-0 max-md:mt-8">
      <h3 className="self-start text-base text-white">
        {title}
      </h3>
      <ul className="mt-6 text-sm leading-none text-gray-300 bg-lime-900 bg-opacity-0">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex flex-col justify-center items-start py-1 mt-2 first:mt-0 bg-lime-900 bg-opacity-0 max-md:pr-5"
          >
            {item.href ? (
              <a href={item.href} className="hover:text-white transition-colors">
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default FooterNavColumn;
