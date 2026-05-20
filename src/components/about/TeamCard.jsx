import { motion } from 'framer-motion';

/**
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.role
 * @param {string} props.org
 * @param {string} props.bio
 * @param {string} props.initials
 * @param {string} [props.photo] — public/ altı, örn. /team/ad.webp
 * @param {number} [props.index]
 */
export default function TeamCard({ name, role, org, bio, initials, photo, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-[12px] border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      {photo ? (
        <img
          src={photo}
          alt={name}
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          className="h-24 w-24 rounded-full border-2 border-primary/35 object-cover object-center shadow-lg shadow-primary/10"
        />
      ) : (
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg font-bold text-primary"
          aria-hidden
        >
          {initials}
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-sm font-medium text-primary">{role}</p>
      <p className="mt-1 text-xs text-muted">{org}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-light">{bio}</p>
    </motion.article>
  );
}
