<template>
<q-dialog v-model="ui.d.detailspeople" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [pSt.peC.na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card class="q-pa-sm">
      <apercu-genx :id="session.peopleId" />
      <div class="row">
        <div v-if="aSt.actPeC">
          <div v-if="aSt.actPeC.nasp" class="titre-md text-bold text-warning">
            {{$t('sponsor')}}</div>
          <div v-else class="titre-md">{{$t('PPco')}}</div>
        </div>
      </div>

      <barre-people v-if="session.estComptable || aSt.estSponsor" :id="pSt.peC.na.id"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div>

      <div class="q-ml-lg" v-for="(na) in aSt.compte.lstAvatarNas" :key="na.id">
        <div class="titre-md text-bold">{{na.nom}}</div>
        <micro-chat class="q-ml-md" :na-e="pSt.peC.na" :na-i="na"/>
      </div>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <q-card-section v-if="ui.egrplus" class="bord q-ma-sm q-pa-xs">
        <div class="titre-lg text-italic text-center q-ma-sm">
          {{$t('PPctc', [gSt.egrC.groupe.na.nom, pSt.peC.na.nom])}}
        </div>
        <div v-if="diag !== 0"
          class="q-ma-md q-pa-xs titre-md bg-yellow-3 text-warning text-bold text-center">
          {{$t('PPctc' + diag)}}
        </div>
        <div v-else class="row justify-center q-my-sm">
          <q-btn dense size="md" color="primary" padding="xs"
            icon="add" :label="$t('ajouter')" @click="contact"/>
        </div>
      </q-card-section>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="[idg, ids] in pSt.peC.groupes" :key="ids + '/' + idg">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{egr(idg).groupe.na.nomc}} - {{$t('AMm' + stmb(idg, ids))}}</span>
          <q-btn class="col-auto" dense padding="xs" size="sm" 
            icon-right="open_in_new" color="primary"
            :label="$t('PGvg')" @click="voirgr(idg, ids)"/>
        </div>
      </div>

    </q-card>
  
  </q-page-container>

</q-layout>
</q-dialog>
</template>
<script>

import { ref, onMounted, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuChat from './ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import MicroChat from '../components/MicroChat.vue'
import { Chat, Motscles, Groupe } from '../app/modele.mjs'
import { NouveauMembre } from '../app/operations.mjs'
import { styp, sleep } from '../app/util.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuGenx, BoutonHelp, BarrePeople, MicroChat },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
  },
  
  data () {
    return {
    }
  },

  methods: {
    egr (idg) { return this.gSt.egr(idg) },

    stmb (idg, ids) { return this.egr(idg).groupe.statutMajeur(ids)},

    voirgr (id, ids) {
      this.session.setGroupeId(id)
      this.session.setMembreId(ids)
      this.ui.setPage('groupe', 'membres')
    },

    async contact () {
      while (true) {
        if (await this.diagctct()) return // Anomalie nouvelle
        const gr = this.gSt.egrC.groupe // groupe courant d'où vient la proposition d'inscription en contact
        const pe = this.pSt.peC // people courant
        const [nouveau, slot] = await gr.slot(pe.na)
        if (await new NouveauMembre().run(gr, slot, pe.na, pe.cv)) {
          this.session.setMembreId(slot)
          this.ui.setPage('groupe', 'membres')
          this.ui.egrplus = false
          return
        }
        await sleep(1000)
      }
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const aSt = stores.avatar
    const gSt = stores.groupe
    const ui = stores.ui

    /* Le contact peut avoir été ouvert pour être inscrit comme contact du groupe
    courant, ce que le panel sait par la variable ui.egrplus
    On estime ici si ce choix est possible ou non:
    - le nag du contact dans le groupe courant est nécessaire pour savoir
    si ce contact est ou non en liste noire du groupe.
    - le calcul du nag est async (c'est un cryptage).
    En conséquence ce calcul de diagnostic intervient de manière async
    dans le onMounted.
    */
    const diag = ref(0)

    async function diagctct () {
      if (pSt.peC.groupes.has(gSt.egrC.groupe.na.id)) { diag.value = 2; return }
      const gr = gSt.egrC.groupe // groupe courant d'où vient la proposition d'inscription en contact
      const pe = pSt.peC // people courant
      const nag = await Groupe.getNag(gr.na, pe.na)
      if (gr.enLNA(0, nag)) { diag.value = 3; return }
      if (gr.enLNC(0, nag)) { diag.value = 4; return }
      const [amb, ano] = gSt.ambano
      if (!amb) { diag.value = 1; return } // ça ne devrait pas se produire ici
      diag.value = 0
    }

    if (ui.egrplus) onMounted(async () => {
       await diagctct()
    })
    /*********************************************************/

    return {
      styp, session, aSt, pSt, gSt, ui, diag, diagctct
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 2px double $orange
  border-radius: 10px !important
.q-card__section
  padding: 2px !important
</style>
