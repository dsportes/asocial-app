<template>
<q-dialog v-model="ui.d.detailspeople" full-height persistent>
<q-layout v-if="session.ok" container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
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

      <div v-for="(na, idx) in aSt.compte.lstAvatarNas" :key="na.id">
        <apercu-chat class="q-my-md" affnai
          :na-i="na" :na-e="pSt.peC.na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
      </div>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div v-if="ui.egrplus && !pSt.peC.groupes.has(gSt.egrC.groupe.na.id)"
        class="q-ma-md bordo column items-center">
        <div class="full-width titre-md bg-yellow-3 text-warning text-bold text-center">
          {{$t('PGplus5b', [gSt.egrC.groupe.na.nom, pSt.peC.na.nom])}}
        </div>
        <q-btn class="text-center q-my-sm" dense size="md" no-caps color="primary" icon="check"
          :label="$t('ok')" @click="contact"/>
      </div>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="[idg, ids] in pSt.peC.groupes" :key="ids + '/' + idg">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{egr(idg).groupe.na.nomc}} - {{$t('AMm' + stmb(idg, ids))}}</span>
          <q-btn class="col-auto btn1" dense size="sm" icon-right="open_in_new" color="primary"
            :label="$t('detail')" @click="voirgr(idg, ids, true)"/>
          <q-btn class="col-auto btn1" dense size="sm" icon-right="open_in_new" color="primary"
            :label="$t('PGvg')" @click="voirgr(idg, ids)"/>
        </div>
      </div>

    </q-card>
  </q-page-container>

  <!-- Dialogue de détail d'un membre d'un groupe -->
  <q-dialog v-model="ui.d.PPinfoedit" persistent full-height>
    <q-card class="bs" style="width:80vw">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" icon="close" color="warning" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('PPtit', [mbC.na.nom, gSt.egrC.groupe.na.nom])}}</q-toolbar-title>
      </q-toolbar>
      <apercu-membre :eg="gSt.egrC" :mb="mbC" :idav="pSt.peC.na.id" :im="mbC.ids" :mapmc="mapmc" :idx="0" people nopanel/>
    </q-card>
  </q-dialog>

</q-layout>
</q-dialog>
</template>
<script>

import { ref, onMounted, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuChat from '../components/ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ApercuMembre from '../components/ApercuMembre.vue'
import { Chat, Motscles, Groupe } from '../app/modele.mjs'
import { NouveauMembre } from '../app/operations.mjs'
import { afficherDiag, sleep } from '../app/util.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuMembre, ApercuGenx, BoutonHelp, ApercuChat, BarrePeople },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
  },
  
  data () {
    return {
      egrC: null,
      mbC: null,
    }
  },

  methods: {
    egr (idg) { return this.gSt.egr(idg) },

    stmb (idg, ids) { return this.egr(idg).groupe.statutMajeur(ids)},

    voirgr (id, ids, opt) {
      this.session.setGroupeId(id)
      this.session.setMembreId(ids)
      this.egrC = this.gSt.egr(id)
      this.mbC = this.gSt.getMembre(id, ids)
      if (opt) {
        this.ui.oD('PPinfoedit')
        return
      }
      this.ui.fD()
      this.ui.setPage('groupe', 'membres')
    },

    async contact () {
      while (true) {
        const [amb, ano] = this.gSt.ambano
        if (!amb) { // ça ne devrait pas se produire ici
          await afficherDiag(this.$t('PPamb'))
          return
        }
        const gr = this.gSt.egrC.groupe // groupe courant d'où vient la proposition d'inscription en contact
        const pe = this.pSt.peC // people courant
        const nag = await Groupe.getNag(gr.na, pe.na)
        if (gr.enLNA(0, nag)) {
          await afficherDiag(this.$t('PPlna'))
          return
        }
        if (gr.enLNC(0, nag)) {
          await afficherDiag(this.$t('PPlnc'))
          return
        }
        const [nouveau, slot] = await gr.slot(pe.na)
        if (!nouveau) { // ça ne devrait pas se produire ici
          await afficherDiag(this.$t('PPctc'))
          return
        }
        this.ui.egrplus = false
        if (await new NouveauMembre().run(gr, slot, pe.na, pe.cv)) {
          this.session.setMembreId(slot)
          this.fD()
          this.ui.setPage('groupe', 'membres')
          return
        }
        await sleep(500)
      }
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const aSt = stores.avatar
    const gSt = stores.groupe
    const ui = stores.ui

    const mapmc = ref(Motscles.mapMC(true, 0))

    const ids = reactive({})
    onMounted(async () => {
      for(const na of aSt.compte.lstAvatarNas) {
        ids[na.id] = await Chat.getIds(na, pSt.peC.na)
      }
    })

    return {
      session, aSt, pSt, gSt, ui,
      mapmc, ids
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bordo
  border: 2px solid $orange
  border-radius: 5px
.bord1
  border: 1px solid $grey-5
.bord2
  background: $yellow-3
  color: black
  font-weight: bold
.q-card__section
  padding: 2px !important
.q-btn
  padding: 0 3px !important
.btn1
  height: 1.5rem
</style>
