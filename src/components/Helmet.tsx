import React, { useEffect } from 'react';

interface HelmetProps {
  children?: React.ReactNode;
}

/**
 * Modern React 19 compatible Helmet component.
 * Replaces legacy react-helmet / react-side-effect which triggered
 * UNSAFE_componentWillMount warnings in StrictMode.
 */
export const Helmet: React.FC<HelmetProps> = ({ children }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;

      // Handle <title>
      if (child.type === 'title') {
        const titleProps = child.props as { children?: React.ReactNode };
        const textContent = typeof titleProps.children === 'string'
          ? titleProps.children
          : String(titleProps.children ?? '');
        if (textContent) {
          document.title = textContent;
        }
      }

      // Handle <meta>
      else if (child.type === 'meta') {
        const { name, property, content } = child.props as {
          name?: string;
          property?: string;
          content?: string;
        };

        if (content !== undefined) {
          let metaElement: HTMLMetaElement | null = null;
          if (name) {
            metaElement = document.querySelector(`meta[name="${name}"]`);
            if (!metaElement) {
              metaElement = document.createElement('meta');
              metaElement.setAttribute('name', name);
              document.head.appendChild(metaElement);
            }
          } else if (property) {
            metaElement = document.querySelector(`meta[property="${property}"]`);
            if (!metaElement) {
              metaElement = document.createElement('meta');
              metaElement.setAttribute('property', property);
              document.head.appendChild(metaElement);
            }
          }

          if (metaElement) {
            metaElement.setAttribute('content', content);
          }
        }
      }

      // Handle <link>
      else if (child.type === 'link') {
        const { rel, href } = child.props as { rel?: string; href?: string };
        if (rel && href) {
          let linkElement = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
          if (!linkElement) {
            linkElement = document.createElement('link');
            linkElement.setAttribute('rel', rel);
            document.head.appendChild(linkElement);
          }
          linkElement.setAttribute('href', href);
        }
      }
    });
  }, [children]);

  // In React 19, metadata tags can also be natively rendered in the JSX tree
  return <>{children}</>;
};

export default Helmet;
