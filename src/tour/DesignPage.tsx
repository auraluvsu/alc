import { useCourse } from '../course'
import { Plus } from '../components/Bridge'
import { to } from '../router'

/** Per-course design space. A placeholder for now; content arrives later. */
export function DesignPage() {
  const course = useCourse()
  const lang = course.hero.accent.replace(/\d+$/, '')   // 'C++23' → 'C++', 'Go' → 'Go'
  return (
    <div className="col">
      <header className="mod-head">
        <span className="eyebrow">Design</span>
        <h1><Plus text={`${lang} design`} /></h1>
        <p className="summary">
          A space for design notes, architecture sketches and experiments in <Plus text={lang} />. It is set up and
          routed, ready for whatever we build here next.
        </p>
      </header>
      <div className="outline">
        <span className="eyebrow">Nothing here yet</span>
        <p style={{ margin: 0 }}>Meanwhile, the course, dictionary and standard-library guide are all ready to use.</p>
        <div className="btn-row">
          <a className="btn primary" href={to(course.base)}>Go to the course</a>
          <a className="btn" href={to(`${course.base}/standard`)}>The Standard</a>
        </div>
      </div>
    </div>
  )
}
