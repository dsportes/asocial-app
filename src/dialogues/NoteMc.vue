<template>
<div :class="dkli(0) + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOedtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOedtit2', [groupe.na.nomc])}}</q-toolbar-title>
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
        <choix-motscles du-compte :src="mc['0']" :titre="$t('PNOmcap')" :arg="{im:-1}" @ok="valider"/>
      </div>
      <div v-else class="sp30">
        <div v-if="nSt.note.auts.length" class="col-auto q-mt-sm">
          {{$t('PNOauts', nSt.note.auts.length) + ' ' + nomAuts}}
        </div>

        <div v-if="msg">
          <div class="q-mt-sm titre-md bg-yellow-5 text-black text-bold q-pa-xs">
            {{msg}}
          </div>
          <apercu-motscles class="col-auto q-mt-xs" :mapmc="mapmc" :src="mc['0']" :du-groupe="groupe.id"/>
        </div>
        <div v-else>
          <choix-motscles class="col-auto q-mt-sm"
            :du-groupe="groupe.id" :titre="$t('PNOmcgr')" :arg="{im:0}" :src="mc['0']" @ok="valider"/>
        </div>
        <div v-for="[im, x] of ims" :key="im">
          <choix-motscles class="col-auto q-mt-md" du-compte 
            :titre="$t('PNOmcgp', [x.na.nom])" :src="mc['' + im]" :arg="{im:im}" @ok="valider"/>
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
import { $t } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ChoixMotscles from '../components/ChoixMotscles.vue'
import ApercuMotscles from '../components/ApercuMotscles.vue'
import { McNote } from '../app/operations.mjs'

export default {
  name: 'NoteMc',

  components: { 
    BoutonHelp,
    ApercuMotscles, // mapmc: Object, src: Object, edit: Boolean, idx: Number, duCompte: Boolean, duGroupe: Number
    ChoixMotscles // props: { duCompte: Boolean, duGroupe: Number, src: Object, titre: String },
  },

  props: { 
    ims: Object /* Map par im des { na, st } des avc membres du groupe */
  },

  computed: {
    nomAuts () {
      const ln = []
      this.nSt.mbAuteurs.forEach(m => { ln.push(m.na.nomc)})
      return ln.join(', ')
    }
  },

  watch: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    aa (st) { return st === 32 ? $t('animateur') : $t('auteur') },
    async valider ({ok, mc, arg}) {
      if (ok) {
        this.mc[arg.im] = mc
        // await new McNote().run(this.note.id, this.note.ids, mc, arg.im)
      }
      if (arg.im === -1) MD.fD()
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
    } else {
      groupe.value = gSt.egr(nSt.note.id).groupe
      mapmc.value = ref(Motscles.mapMC(false, groupe.value.id))
      im.value = nSt.note.im
      if (im.value) { // il y a une exclusivité
        imna.value = gSt.imNaSt(groupe.value.id, im.value)
        if (!ims.value.has(im.value)) { // exclu n'est pas avatar du compte
          if (mxst.value !== 32) // compte pas animateur : ne peut pas éditer mcg
            msg.value = $t('PNOm1')
        }
      } else {
        if (mxst.value < 31) // compte ni auteur ni animateur : ne peut pas éditer mcg
            msg.value = $t('PNOm2')
      }
      mc.value['0'] = note.value.mc['0'] || new Uint8Array([])
      ims.value.forEach((x, im) => {
        mc.value['' + im] = note.value.mc['' + im] || new Uint8Array([])
      })
    }

    return {
      ui, session, nSt, gSt, pSt,
      im, imna, avatar, groupe, note, msg, mapmc, mc,
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
