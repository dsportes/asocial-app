<template>
<div :class="dkli(0) + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t('PNOextit', [groupe.na.nomc])}}
      </q-toolbar-title>
      <bouton-undo :cond="modifie" @click="undo"/>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ednom" inset
      class="full-width bg-secondary text-white">
      <q-toolbar-title class="text-italic titre-md text-center">{{$t('PNOexc', [ednom])}}</q-toolbar-title>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <div class="titre-lg text-italic text-center">{{$t('PNOlex')}}</div>
      <div class="sp30 q-mt-sm scroll" style="height:40vh">
        <div v-for="(e, idx) in lst" :key="idx" 
          :class="dkli(idx) + ' q-mt-xs row cursor-pointer bord' + (e.im === imap ? '2' : '1')"
          @click="selmb(e)">
          <div class="col-8">{{e.nom}}</div>
          <div class="col-4">{{aa(e.st)}}</div>
        </div>
      </div>
      <!--   props: { 
      na: Object, // na de la persone (people, avatar) ou du groupe 
      ids: Number, // pour un "membre" ids (indice) du membre à afficher
      cv: Object, // carte de visite
      estAvc: Boolean, // true si c'est un avatar du compte
      cvchangee: Function, // fonction d'enregistrement de la CV quand elle a été éditée
      detailPeople: Boolean, // bouton d'affichage du détail du people
      idx: Number
      -->
      <q-separator color="orange" class="q-mt-sm"/>
      <div v-if="nSt.note.auts.length" class="col-auto q-mt-sm">
        <liste-auts/>
      </div>

      <q-btn :disable="!im && !imap" flat class="q-my-sm" color="warning" 
        :label="$t('PNOexsuppr')" @click="suppr"/>
      <apercu-genx class="q-my-md" v-if="c && c.cv" :na="c.na" :cv="c.cv" :est-avc="c.avc"/>
      <div v-if="c && !c.cv" class="q-my-md titre-md text-italic">{{$t('PNOnocv', [c.nom])}}</div>
      <div><q-btn class="q-my-sm" size="md" no-caps dense color="primary" 
        :label="$t('CVraf')" @click="rafCvs"/></div>

    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { $t } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ListeAuts from '../components/ListeAuts.vue'
import { ExcluNote, RafraichirCvs } from '../app/operations.mjs'

export default {
  name: 'NoteExclu',

  components: { BoutonHelp, BoutonUndo, ApercuGenx, ListeAuts },

  props: { ims: Object },

  computed: {
    nomAuts () {
      const ln = []
      this.nSt.mbAuteurs.forEach(m => { ln.push(m.na.nomc)})
      return ln.join(', ')
    },
    modifie () { return this.im !== this.imap }
  },

  watch: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    aa (st) { return st === 32 ? $t('animateur') : $t('auteur') },
    selmb (e) {
      e.cv = this.cv(e)
      this.c = e
      this.imap = e.im
    },
    undo () {
      this.imap = this.im
      if (this.im) {
        this.lst.forEach(e => { if (e.im === this.im) this.c = e})
      } else this.c = null
    },
    suppr () {
      this.imap = 0
      this.c = null
    },
    async valider () {
      const n = this.nSt.note
      await new ExcluNote().run(n.id, n.ids, this.imap)
      MD.fD()
    },
    async rafCvs () {
      const [nt, nr] = await new RafraichirCvs().run(this.groupe.id)
      stores.ui.afficherMessage(this.$t('CVraf2', [nr, nt - nr]), false)
    }
  },

  data () {
    return {
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const gSt = stores.groupe
    const aSt = stores.avatar
    const pSt = stores.people

    /* Map par im des { na, st, avc } des membres du groupe, avc ou auteur-animateur */
    const ims = toRef(props, 'ims')
    const im = ref(nSt.note.im)
    const imap = ref(im.value) // im nouveau attribué (ou 0)
    const c = ref(null) // élément e courant
    const ednom = ref(im.value ? ims.value.get(im.value).na.nom : '')
    const groupe = ref(gSt.egr(nSt.note.id).groupe)

    function cv(x) {
      return !x.avc ? pSt.getCv(x.na.id) : aSt.getAvatar(x.na.id).cv
    }

    const lst = []
    ims.value.forEach((e, ids) => {
      const x = { ...e }
      x.im = ids
      x.nom = e.avc ? $t('moi2', [ e.na.nom]) : e.na.nomc
      if (ids === im.value) {
        x.cv = cv(x)
        c.value = x
      }
      lst.push(x)
    })
    lst.sort((a,b) => {
      if (a.im === im.value) return -1
      if (b.im === im.value) return 1
      if (a.avc && b.avc) return (a.nom < b.nom ? -1 : 1)
      if (a.avc) return -1
      if (b.avc) return 1
      return (a.nom < b.nom ? -1 : (a.nom === b.nom ? 1 : 0))
    })

    return {
      ui, session, nSt, gSt, pSt, cv,
      im, imap, ednom, groupe, lst, c,
      MD
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 2px solid transparent
.bord2
  border: 2px solid $warning
</style>
