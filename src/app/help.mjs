const pages = {

  page1: { sub: 's1a', pos: 10,
    titre: { 
      'en-EN': 'Presentation',
      'fr-FR': 'Présentation'
    },
    voir: ['page2', 'page3'] 
  },

  page2: { sub: 's1a', pos: 20,
    titre: {
      'en-EN': 'Page with a SVG', 
      'fr-FR': 'Page avec un SVG'
    }, 
    voir: ['page1', 'page3']
  },

  page3: { sub: 's1b', pos: 10,
    titre: { 
      'en-EN': 'Title of page 3',
      'fr-FR': 'Titre de la page 3'
    },
    voir: ['page9'] 
  },

  page9: { 
    titre: { 
      'en-EN': 'No page',
      'fr-FR': 'Y\'en a pas'
    }, 
    voir: [] 
  }
}

const sections = [
  { id: 's1', titre: { 'en-EN': 'No page', 'fr-FR': 'Section I' }, 
    ss: [
      { id: 's1a', titre: { 'en-EN': 'No page', 'fr-FR': 'Sous Section (a)' }  },
      { id: 's1b', titre: { 'en-EN': 'No page', 'fr-FR': 'Sous Section (b)' }  },    
    ]  
  },
  { id: 's2', titre: { 'en-EN': 'No page', 'fr-FR': 'Section II' }, 
    ss: [
      { id: 's2a', titre: { 'en-EN': 'No page', 'fr-FR': 'Sous Section (a)' }  },
      { id: 's2b', titre: { 'en-EN': 'No page', 'fr-FR': 'Sous Section (b)' }  },    
    ]  
  }
]

export const arbres = {
}

const chapitres = {
}

export function parents (p) {
  const a = [p]
  const e1 = pages[p]
  if (e1) {
    const e2 = chapitres[e1.sub]
    if (e2) {
      a.push(e2.id)
      const e3 = chapitres[e2.section]
      if (e3) a.push(e3.id)
    }
  }
  return a
}

export function titre (lg, p) {
  const e = p.startsWith('s') ? chapitres[p] : pages[p]
  return e ? tit(lg, e) : null
}

function tit (lg, e) {
  return e.titre[lg] || e.titre['fr-FR']
}

export function init (lg) {
  const subs = new Map()
  const tm = []
  sections.forEach(sec => {
    const n = { 
      id: sec.id, 
      label: tit(lg, sec) || '???', 
      children: [], 
      type: 1
    }
    chapitres[sec.id] = { id: sec.id, titre: sec.titre }
    sec.ss.forEach(sub => {
      const s = { 
        id: sub.id, 
        label: tit(lg, sub) || '???', 
        children: [], 
        type: 2
      }
      chapitres[sub.id] = { id: sub.id, titre: sub.titre, section: sec.id }
      subs.set(sub.id, s)
      n.children.push(s)
    }) 
    tm.push(n)
  })

  for (const page in pages) {
    const p = pages[page]
    const e = { 
      id: page, 
      label: tit(lg, p) || '???', 
      children: [], 
      type: 3, 
      pos: p.pos || 1 
    }
    const sub = subs.get(p.sub)
    if (sub) {
      sub.children.push(e)
      if (p.voir) p.voir.forEach(vpage => {
        const vp = pages[vpage]
        if (vp)
          e.children.push({ 
          id: vp.sub + '/' + vpage, page: vpage + '_' + lg, 
          label: tit(lg, vp) || '???', 
          type: 4
        })
      })
    }
  }

  subs.forEach(sub => {
    sub.children.sort((a, b) => { return a.pos < b.pos ? -1 :( a.pos === b.pos ? 0 : 1)})
  })

  arbres[lg] = tm
}