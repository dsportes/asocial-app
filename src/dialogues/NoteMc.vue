<template>
<q-dialog v-model="ui.d.NM" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOmctit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOmctit2', [groupe.na.nomc])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.editDiag" inset class="full-width bg-secondary text-white">
      <div class='q-ma-sm q-pa-sm text-center text-bold titre-md bg-yellow-5 text-warning'>
        {{session.editDiag}}
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="sp30 q-pa-xs column">
      <liste-auts class="q-my-sm"/>

      <div v-if="avatar" class="q-my-md">
        <div class="q-mb-sm titre-md text-bold text-italic text-center">{{$t('PNOmcp')}}</div>
        <choix-motscles v-model="mcap" :editable="!session.editDiag" :init-value="mc"
          du-compte :titre="$t('PNOmcap')" />
      </div>
      <div v-else class="q-my-md">
        <div class="q-mb-sm titre-md text-bold text-italic text-center">{{$t('PNOmcp')}}</div>
        <choix-motscles v-model="mcap" :editable="!session.editDiag" :init-value="mc"
          du-compte :du-groupe="groupe.id" :titre="$t('PNOmcgp')"/> 

        <q-separator color="orange" class="q-my-md"/>

        <div class="q-mb-sm titre-md text-bold text-italic text-center">
          {{$t('PNOmcg')}}
          <bouton-bulle idtext="mcgr"/>
        </div>

        <div class="sp30"> <!-- Bloc exclu -->
        <div v-if="xav">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx v-if="xav.na" class="q-my-md" :id="xav.na.id" :im="xav.im"/>
          <div v-else class="titre-md text-bold">{{xav.nom}}</div>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>
      </div>
  
      <div v-if="msg" class="q-mt-sm titre-md bg-yellow-5 text-negative text-bold q-pa-xs">{{msg}}</div>
      
      <choix-motscles v-else class="q-mt-sm" v-model="mc0ap" 
        :editable="!session.editDiag && !msg"
        :du-groupe="groupe.id" :titre="$t('PNOmcgr')" :init-value="mc0"/>
      </div>

      <div class="row items-center justify-around">
        <q-btn size="md" dense color="primary" :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn v-if="!session.editDiag" size="md" dense color="warning" 
          :disable="!modif" :label="$t('valider')" @click="valider"/>
      </div>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { $t, egaliteU8, dkli, styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ChoixMotscles from '../components/ChoixMotscles.vue'
import ListeAuts from '../components/ListeAuts.vue'
import BoutonBulle from '../components/BoutonBulle.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import { McNote } from '../app/operations.mjs'

export default {
  name: 'NoteMc',

  components: { BoutonHelp, BoutonBulle, ApercuGenx, ChoixMotscles, ListeAuts },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modif () { 
      if (!egaliteU8(this.mc, this.mcap)) return true
      if (this.mc0 && !egaliteU8(this.mc0, this.mc0ap)) return true
      return false
    }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modif) this.ui.oD('confirmFerm'); else this.ui.fD() },

    async valider () {
      const mc = !egaliteU8(this.mc, this.mcap) ? this.mcap : null
      const mc0 = this.mc0 && !egaliteU8(this.mc0, this.mc0ap) ? this.mc0ap : null
      await new McNote().run(this.note, mc, mc0)
      this.ui.fD()
    }
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const nSt = stores.note
    const gSt = stores.groupe
    const aSt = stores.avatar
    const pSt = stores.people
    const ui = stores.ui

    const avatar = ref(null)
    const groupe = ref(null)
    const note = ref(nSt.note)
    const mc = ref(note.value.mc)
    const mcap = ref(null)
    const mc0 = ref(null)
    const mc0ap = ref(null)
    const msg = ref('')
    const xav = ref()

    mcap.value = mc.value

    if (nSt.node.type === 4) {
      avatar.value = aSt.getElt(note.value.id).avatar
    } else {
      const egr = gSt.egr(note.value.id)
      groupe.value = egr.groupe
      mc0.value = note.value.mc0
      mc0ap.value = mc0.value
      xav.value = nSt.mbExclu // retourne { avc: true/false, nom } ou null s'il n'y a pas d'exclusivité

      /* BULLEmcgr: `Pour attribuer des mots-clés "du groupe" à une note de groupe, un compte doit:
      - soit avoir lui-même l\'excluvité d\'écriture sur la note,
      - soit avoir un pouvoir d\'animateur dans le groupe,
      - soit, quand aucune exclusivité n\'est attribuée, avoir un droit d\'écriture des notes du groupe.`
      */
      if (!egr.estAnim) {
        if (note.value.im) { // il y a une exclusivité
          // na de l'avatar DU COMPTE ayant l'exclusivité
          const na = aSt.compte.naDeIdgIm(note.value.id, note.value.im)
          if (!na) msg.value = $t('PNOm1')
        } else {
          // set des im des avatars du compte ayant droit d'écriture
          const s = groupe.value.avcAuteurs()
          if (!s.size) msg.value = $t('PNOm2')
        }
      }
    }

    function cv(x) {
      return !x.avc ? pSt.getCv(x.na.id) : aSt.getAvatar(x.na.id).cv
    }

    return {
      session, nSt, gSt, ui,
      avatar, groupe, note, msg, mc, mcap, mc0, mc0ap, xav,
      dkli, cv, styp
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
