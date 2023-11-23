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

  <q-page-container>
    <q-page class="q-pa-xs column">
      <div v-if="avatar" class="sp30 q-my-md">
        <choix-motscles v-model="mcap['0']" editable du-compte 
          :init-value="mc['0']" :titre="$t('PNOmcap')" />
      </div>
      <div v-else class="sp30 q-my-md">
        <div v-if="msg" class="q-mt-sm titre-md bg-yellow-5 text-black text-bold q-pa-xs">
          {{msg}}
        </div>
        <choix-motscles class="col-auto q-mt-sm" v-model="mc0ap" :editable="!msg"
          :du-groupe="groupe.id" :titre="$t('PNOmcgr')" :init-value="mc0"/>
        
        <div v-for="[im, x] of ims" :key="im">
          <choix-motscles class="col-auto q-mt-md" v-model="mcap['' + im]" editable
            du-compte :titre="$t('PNOmcgp', [x.na.nom])" :init-value="mc['' + im]"/>
        </div>    
      </div>
      <!--
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
      -->
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD, Motscles } from '../app/modele.mjs'
import { $t, egaliteU8, dkli } from '../app/util.mjs'
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
    modif () { 
      for(const im in this.mc) { if (!egaliteU8(this.mc[''+im], this.mcap[''+im])) return true }
      return false
    }
  },

  watch: {
  },

  methods: {
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

    const avatar = ref(null)
    const groupe = ref(null)
    const note = ref(nSt.note)
    const mc = ref()
    const mcap = ref()
    const mc0 = ref()
    const mc0ap = ref()
    const mapmc = ref(null)
    const msg1 = ref('')
    const msg2 = ref('')

    if (nSt.node.type === 4) {
      avatar.value = aSt.getElt(nSt.note.id).avatar
      im.value = 0
      mc.value = note.value.mc
      mcap.value = mc.value
    } else {
      const egr = gSt.egr(nSt.note.id)
      groupe.value = egr.groupe
      mapmc.value = ref(Motscles.mapMC(false, groupe.value.id))

      /* mots clés du groupe éditables: 
      - soit être animateur
      - soit avoir l'exclusivité
      - soit être auteur quand le compte n'a pas d'exclusité
      */
      if (!egr.estAnim) {
        const na = groupe.value.excluDuCompte(nSt.note.im)
        if (!na) {
          // if (groupe.value.avcAuteurs().size)
        }
        
      }
      if (nSt.note.im) { // il y a une exclusivité
        // na de l'avatar DU COMPTE ayant l'exclusivité
        const na = groupe.value.excluDuCompte(nSt.note.im)
        if (!na && !egr.estAnim) msg.value = $t('PNOm1')
      } else {
        const s = groupe.value.avcAuteurs()
        if (!s.size && !egr.estAnim) msg.value = $t('PNOm2')
      }
      mc0.value = note.value.mc0
      mc0ap.value = mc0.value
      mc.value = note.value.mc
      mcap.value = mc.value
    }

    return {
      ui, session, nSt, gSt, pSt,
      im, imna, avatar, groupe, note, msg, mapmc, mc, mcap,
      MD, dkli
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
