type SectionProps = {
  title: string;
  children: React.ReactNode;
};

export const Section = ({ title, children }: SectionProps) => (
  <section className="section">
    <h2 className="section__title">{title}</h2>
    <div className="section__content">{children}</div>
  </section>
);
