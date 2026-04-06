import { motion as Motion } from 'framer-motion';
import { cx } from '../../utils/cx';

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export function Page({ className = '', children, ...props }) {
  return (
    <Motion.div
      className={cx('page', className)}
      initial="initial"
      animate="animate"
      variants={pageMotion}
      {...props}
    >
      {children}
    </Motion.div>
  );
}

export function StaggerGroup({ className = '', children, ...props }) {
  return (
    <Motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      {...props}
    >
      {children}
    </Motion.div>
  );
}

export function FadeUp({ className = '', children, ...props }) {
  return (
    <Motion.div className={className} variants={fadeUp} {...props}>
      {children}
    </Motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className = '',
  eyebrowAccent = false,
}) {
  return (
    <header className={cx('page-header', className)}>
      <div className="page-header__body">
        {eyebrow ? (
          <p className={cx('eyebrow', eyebrowAccent && 'eyebrow--accent')}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="cluster">{actions}</div> : null}
    </header>
  );
}

export function SectionHeading({ eyebrow, title, description, eyebrowAccent = false }) {
  return (
    <div className="section-heading">
      {eyebrow ? (
        <p className={cx('eyebrow', eyebrowAccent && 'eyebrow--accent')}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className="section-heading__title">{title}</h2>
      {description ? <p className="page-description">{description}</p> : null}
    </div>
  );
}
