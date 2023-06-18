<template>
<div :class="dkli(0) + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOmctit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOmctit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        :disable="!modif" @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="imna" inset
      class="full-width bg-secondary text-white">
      <q-toolbar-title class="text-italic titre-md text-center">{{$t('PNOexc', [imna.nomc])}}</q-toolbar-title>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs column">
      <div v-if="avatar" class="sp30 q-my-md">
        <choix-motscles v-model="mcap['0']" editable du-compte 
          :init-value="mc['0']" :titre="$t('PNOmcap')" />
      </div>
      <div v-else class="sp30">
        <div v-if="nSt.note.auts.length" class="col-auto q-mt-sm">
          <liste-auts/>
        </div>

        <div v-if="msg" class="q-mt-sm titre-md bg-yellow-5 text-black text-bold q-pa-xs">
          {{msg}}
        </div>
        <choix-motscles class="col-auto q-mt-sm" v-model="mcap['0']" :editable="!msg"
          :du-groupe="groupe.id" :titre="$t('PNOmcgr')" :init-value="mc['0']"/>
        
        <div v-for="[im, x] of ims" :key="im">
          <choix-motscles class="col-auto q-mt-md" v-model="mcap['' + im]" editable
            du-compte :titre="$t('PNOmcgp', [x.na.nom])" :init-value="mc['' + im]"/>
        </div>    
      </div>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD, Motscles } from '../app/modele.mjs'
import { $t, egaliteU8 } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ChoixMotscles from '../components/ChoixMotscles.vue'
import ListeAuts from '../components/ListeAuts.vue'
import { McNote } from '../app/operations.mjs'

export default {
  name: 'NoteMc',

  components: { 
    BoutonHelp,
    ChoixMotscles,
    ListeAuts
  },

  props: { 
    ims: Object /* Map par im des { na, st } des avc membres du groupe */
  },

  computed: {
    nomAuts () {
      const ln = []
      this.nSt.mbAuteurs.forEach(m => { ln.push(m.na.nomc)})
      return ln.join(', ')
    },
    modif () { 
      for(const im in this.mc) { if (!egaliteU8(this.mc[''+im], this.mcap[''+im])) return true }
      return false
    }
  },

  watch: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    aa (st) { return st === 32 ? $t('animateur') : $t('auteur') },
    async valider () {
      console.log(this.mcap)
      const chg = {}
      for(const im in this.mc) { 
        if (!egaliteU8(this.mc[''+im], this.mcap[''+im])) chg[im] = this.mcap[''+im]
      }
      await new McNote().run(this.note.id, this.note.ids, chg)
      MD.fD()
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

    /* Map par im des { na, st } des avc membres du groupe */
    const ims = toRef(props, 'ims')
    const im = ref(null)
    const imna = ref(null)
    const avatar = ref(null)
    const groupe = ref(null)
    const note = ref(nSt.note)
    const mc = ref({})
    const mcap = ref({})
    const mapmc = ref(null)
    const msg = ref('')
    const mxst = ref(0)
    ims.value.forEach((x, im) => {
      const {na, st} = x
      if (st >= 31 && st <= 32 && st > mxst.value) mxst.value = st
    })

    if (nSt.node.type === 4) {
      avatar.value = aSt.getElt(nSt.note.id).avatar
      im.value = 0
      mc.value['0'] = note.value.mc || new Uint8Array([])
      mcap.value['0'] = mc.value['0']
    } else {
      groupe.value = gSt.egr(nSt.note.id).groupe
      mapmc.value = ref(Motscles.mapMC(false, groupe.value.id))
      im.value = nSt.note.im
      if (im.value) { // il y a une exclusivité
        imna.value = gSt.imNaStAvc(groupe.value.id, im.value)
        /* Map par im des { na, st } des avc membres du groupe */
        if (!imna.value.has(im.value)) { // exclu n'est pas avatar du compte
          if (mxst.value !== 32) // compte pas animateur : ne peut pas éditer mcg
            msg.value = $t('PNOm1')
        }
      } else {
        if (mxst.value < 31) // compte ni auteur ni animateur : ne peut pas éditer mcg
            msg.value = $t('PNOm2')
      }
      mc.value['0'] = note.value.mc['0'] || new Uint8Array([])
      mcap.value['0'] = mc.value['0']
      ims.value.forEach((x, im) => {
        mc.value['' + im] = note.value.mc['' + im] || new Uint8Array([])
        mcap.value['' + im] = mc.value['' + im]
      })
    }

    return {
      ui, session, nSt, gSt, pSt,
      im, imna, avatar, groupe, note, msg, mapmc, mc, mcap,
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
